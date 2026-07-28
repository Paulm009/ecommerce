<?php

declare(strict_types=1);

use App\Actions\Payments\ConfirmPayment;
use App\Actions\Tickets\ConfirmTicketReservation;
use App\Actions\Tickets\CreateTicketReservation;
use App\Actions\Tickets\ScanTicket;
use App\Models\Event;
use App\Models\PaymentAttempt;
use App\Models\PaymentEvent;
use App\Models\ProductOrder;
use App\Models\Ticket;
use App\Models\TicketOrder;
use App\Models\User;
use App\Support\TicketQrToken;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function (): void {
    $this->seed();
});

it('seeds every operational flow with coherent states', function (): void {
    $this->assertDatabaseCount('companies', 1);
    $this->assertDatabaseCount('roles', 6);
    $this->assertDatabaseCount('permissions', 17);
    $this->assertDatabaseCount('users', 7);
    $this->assertDatabaseCount('layout_templates', 5);
    $this->assertDatabaseCount('events', 6);
    $this->assertDatabaseCount('products', 5);
    $this->assertDatabaseCount('product_orders', 3);
    $this->assertDatabaseCount('pos_sales', 3);
    $this->assertDatabaseCount('payment_incidents', 1);
    $this->assertDatabaseCount('stock_alerts', 1);
    $this->assertDatabaseCount('outbound_emails', 4);
    $this->assertDatabaseCount('access_scans', 1);

    $this->assertDatabaseHas('ticket_reservations', ['status' => 'paid']);
    $this->assertDatabaseHas('ticket_reservations', ['status' => 'temporary_selection']);
    $this->assertDatabaseHas('ticket_reservations', ['status' => 'pending_payment']);
    $this->assertDatabaseHas('ticket_reservations', ['status' => 'expired']);
    $this->assertDatabaseHas('product_orders', ['status' => 'paid']);
    $this->assertDatabaseHas('product_orders', ['status' => 'pending_payment']);
    $this->assertDatabaseHas('product_orders', ['status' => 'cancelled']);
    $this->assertDatabaseHas('pos_sales', ['status' => 'confirmed']);
    $this->assertDatabaseHas('pos_sales', ['status' => 'pending_payment']);
    $this->assertDatabaseHas('pos_sales', ['status' => 'cancelled']);
    expect(ProductOrder::query()->where('status', 'paid')->firstOrFail()->items()->count())->toBe(2);
});

it('confirms a ticket payment idempotently', function (): void {
    $occurrence = Event::query()->where('name', 'Noche Sinfónica')->firstOrFail()->occurrences()->with(['layout.locations', 'ticketTypes'])->firstOrFail();
    $location = $occurrence->layout->locations->firstWhere('is_selectable', true);
    $ticketType = $occurrence->ticketTypes->first();
    $reservation = app(CreateTicketReservation::class)->handle($occurrence, [[
        'event_location_id' => $location->id,
        'ticket_type_id' => $ticketType->id,
        'quantity' => 2,
    ]], 'test-idempotency-session-token-000000000');
    $payment = app(ConfirmTicketReservation::class)->handle($reservation, [
        'buyer_name' => 'Prueba Idempotente',
        'buyer_email' => 'idempotente@example.com',
        'buyer_phone' => '+591 70000001',
        'buyer_identity_document' => 'IDEMP-1',
    ]);
    $ordersBefore = TicketOrder::query()->count();
    $ticketsBefore = Ticket::query()->count();

    app(ConfirmPayment::class)->handle($payment, 'BANK-IDEMPOTENT-001', 'EVENT-IDEMPOTENT-001', 'test');
    app(ConfirmPayment::class)->handle($payment, 'BANK-IDEMPOTENT-001', 'EVENT-IDEMPOTENT-001', 'test');

    expect(TicketOrder::query()->count())->toBe($ordersBefore + 1)
        ->and(Ticket::query()->count())->toBe($ticketsBefore + 1)
        ->and(PaymentEvent::query()->where('payment_attempt_id', $payment->id)->count())->toBe(1);
    $this->assertDatabaseHas('ticket_reservations', ['id' => $reservation->id, 'status' => 'paid']);
});

it('applies and consumes event promotion codes', function (): void {
    $occurrence = Event::query()->where('name', 'Festival Fuego 2026')->firstOrFail()->occurrences()->with(['layout.locations', 'ticketTypes'])->firstOrFail();
    $reservation = app(CreateTicketReservation::class)->handle($occurrence, [[
        'event_location_id' => $occurrence->layout->locations->first()->id,
        'ticket_type_id' => $occurrence->ticketTypes->first()->id,
        'quantity' => 1,
    ]], 'promotion-test-session-token-000000000');
    $payment = app(ConfirmTicketReservation::class)->handle($reservation, [
        'buyer_name' => 'Cliente Promoción',
        'buyer_email' => 'promo@example.com',
        'buyer_phone' => '+591 70000002',
        'buyer_identity_document' => 'PROMO-1',
        'promotion_code' => 'FUEGO10',
    ]);

    expect((string) $payment->amount)->toBe('126.00');
    $this->assertDatabaseHas('sales', ['id' => $payment->sale_id, 'subtotal_amount' => 140, 'discount_amount' => 14, 'total_amount' => 126]);
    $this->assertDatabaseHas('promotion_redemptions', ['sale_id' => $payment->sale_id, 'status' => 'reserved', 'discount_amount' => 14]);

    app(ConfirmPayment::class)->handle($payment, 'BANK-PROMO-001', 'EVENT-PROMO-001', 'test');

    $this->assertDatabaseHas('promotion_redemptions', ['sale_id' => $payment->sale_id, 'status' => 'consumed']);
});

it('accepts signed bank webhooks and rejects invalid signatures', function (): void {
    $payment = PaymentAttempt::query()
        ->where('status', 'pending')
        ->whereHas('sale', fn ($query) => $query->where('sale_type', 'tickets'))
        ->firstOrFail();
    $payload = [
        'event_id' => 'WEBHOOK-EVENT-001',
        'payment_reference' => $payment->provider_reference,
        'transaction_id' => 'WEBHOOK-TX-001',
        'status' => 'paid',
        'amount' => $payment->amount,
        'currency' => $payment->currency_code,
    ];
    $encoded = json_encode($payload, JSON_THROW_ON_ERROR);
    $signature = hash_hmac('sha256', $encoded, (string) config('services.bank.webhook_secret'));

    $this->withHeader('X-Bank-Signature', 'invalid')->postJson(route('webhooks.bank.payments'), $payload)->assertForbidden();
    $this->withHeader('X-Bank-Signature', $signature)->postJson(route('webhooks.bank.payments'), $payload)->assertOk()->assertJson(['accepted' => true, 'status' => 'paid']);
    $this->withHeader('X-Bank-Signature', $signature)->postJson(route('webhooks.bank.payments'), $payload)->assertOk();

    $this->assertDatabaseHas('payment_attempts', ['id' => $payment->id, 'status' => 'paid', 'provider_transaction_id' => 'WEBHOOK-TX-001']);
    expect(PaymentEvent::query()->where('provider_event_id', 'WEBHOOK-EVENT-001')->count())->toBe(1);
});

it('consumes multi-use ticket quotas atomically', function (): void {
    $ticket = Ticket::query()->where('recipient_name', 'Invitado Multiuso')->firstOrFail();
    $occurrence = $ticket->occurrence()->firstOrFail();
    $scanner = User::query()->where('email', 'escaneador@example.com')->firstOrFail();
    $token = app(TicketQrToken::class)->for($ticket->id);

    $second = app(ScanTicket::class)->handle($occurrence, $ticket->public_code, $scanner);
    $third = app(ScanTicket::class)->handle($occurrence, $token, $scanner);
    $exhausted = app(ScanTicket::class)->handle($occurrence, $token, $scanner);

    expect($second['result'])->toBe('accepted')->and($second['remaining'])->toBe(1)
        ->and($third['result'])->toBe('accepted')->and($third['remaining'])->toBe(0)
        ->and($exhausted['result'])->toBe('exhausted')->and($exhausted['remaining'])->toBe(0);
    $this->assertDatabaseHas('tickets', ['id' => $ticket->id, 'status' => 'exhausted', 'quota_used' => 3]);
});

it('enforces module permissions on internal routes', function (): void {
    $scanner = User::query()->where('email', 'escaneador@example.com')->firstOrFail();
    $customer = User::query()->where('email', 'cliente@example.com')->firstOrFail();

    $this->actingAs($scanner)->get(route('scanner.index'))->assertOk();
    $this->actingAs($scanner)->get(route('admin.events.index'))->assertForbidden();
    $this->actingAs($customer)->get(route('dashboard'))->assertForbidden();
    $this->actingAs($customer)->get(route('account'))->assertOk();
});

it('renders the public catalog and checkout surfaces', function (): void {
    $event = Event::query()->where('name', 'Festival Fuego 2026')->firstOrFail();
    $payment = PaymentAttempt::query()->where('status', 'pending')->firstOrFail();
    $ticket = Ticket::query()->firstOrFail();

    $this->get(route('home'))->assertOk();
    $this->get(route('events.index'))->assertOk();
    $this->get(route('events.show', $event))->assertOk();
    $this->get(route('store.index'))->assertOk();
    $this->get(route('store.cart'))->assertOk();
    $this->get(route('payments.show', $payment))->assertOk();
    $this->get(route('tickets.show', ['ticket' => $ticket, 'token' => app(TicketQrToken::class)->for($ticket->id)]))->assertOk();
});

it('renders every administration and operations console', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();

    $this->actingAs($admin);

    foreach ([
        'dashboard',
        'admin.events.index',
        'admin.products.index',
        'admin.tickets.index',
        'admin.orders.index',
        'admin.inventory.index',
        'admin.payments.index',
        'admin.layouts.index',
        'admin.users.index',
        'pos.index',
        'cash.index',
        'scanner.index',
        'courtesies.index',
    ] as $routeName) {
        $this->get(route($routeName))->assertOk();
    }
});

it('allows the public ticket view when the signed token is valid even if the stored hash is stale', function (): void {
    $ticket = Ticket::query()->firstOrFail();
    $token = app(TicketQrToken::class)->for($ticket->id);

    $ticket->update([
        'qr_token_hash' => str_repeat('0', 64),
    ]);

    $this->get(route('tickets.show', ['ticket' => $ticket, 'token' => $token]))->assertOk();
});

it('manages event states and promotion codes', function (): void {
    $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
    $event = Event::query()->where('status', 'draft')->firstOrFail();

    $this->actingAs($admin)
        ->patch(route('admin.events.status', $event), ['status' => 'published'])
        ->assertRedirect();
    $this->assertDatabaseHas('events', ['id' => $event->id, 'status' => 'published']);

    $this->actingAs($admin)
        ->post(route('admin.events.promotions.store', $event), [
            'code' => 'VERANO15',
            'discount_type' => 'percentage',
            'discount_value' => '15.00',
            'maximum_redemptions' => 50,
        ])
        ->assertRedirect();
    $this->assertDatabaseHas('promotion_codes', ['event_id' => $event->id, 'code' => 'VERANO15']);
});
