<?php

declare(strict_types=1);

namespace Database\Seeders;

use App\Actions\Cash\OpenCashSession;
use App\Actions\Inventory\AdjustInventory;
use App\Actions\Operations\ReleaseExpiredHolds;
use App\Actions\Orders\CreateProductOrder;
use App\Actions\Payments\ConfirmPayment;
use App\Actions\Pos\CreatePosSale;
use App\Actions\Tickets\ConfirmTicketReservation;
use App\Actions\Tickets\CreateTicketReservation;
use App\Actions\Tickets\IssueCourtesyTickets;
use App\Actions\Tickets\ScanTicket;
use App\Models\AuditLog;
use App\Models\CashMovement;
use App\Models\CashRegister;
use App\Models\Company;
use App\Models\Event;
use App\Models\PaymentAttempt;
use App\Models\ProductOrder;
use App\Models\ProductVariant;
use App\Models\TicketReservation;
use App\Models\User;
use App\Support\TicketQrToken;
use Illuminate\Database\Seeder;

final class DemoFlowsSeeder extends Seeder
{
    public function run(): void
    {
        $company = Company::query()->firstOrFail();
        $admin = User::query()->where('email', 'admin@example.com')->firstOrFail();
        $seller = User::query()->where('email', 'vendedor@example.com')->firstOrFail();
        $scanner = User::query()->where('email', 'escaneador@example.com')->firstOrFail();
        $occurrence = Event::query()->where('name', 'Festival Fuego 2026')->firstOrFail()->occurrences()->with(['layout.locations', 'ticketTypes'])->firstOrFail();
        $location = $occurrence->layout->locations->firstWhere('is_selectable', true);
        $ticketType = $occurrence->ticketTypes->first();
        $item = ['event_location_id' => $location->id, 'ticket_type_id' => $ticketType->id, 'quantity' => 1];
        $buyer = ['buyer_name' => 'Cliente Demo', 'buyer_email' => 'cliente@example.com', 'buyer_phone' => '+591 71234567', 'buyer_identity_document' => 'CI-DEMO-001'];

        $paidReservation = $this->ticketReservation($occurrence, [[...$item, 'quantity' => 2]], 'paid');
        $paidPayment = app(ConfirmTicketReservation::class)->handle($paidReservation, $buyer);
        app(ConfirmPayment::class)->handle($paidPayment, 'BANK-TICKET-PAID-001', 'EVENT-TICKET-PAID-001', 'demo_seed');

        $this->ticketReservation($occurrence, [$item], 'temporary');
        $pendingReservation = $this->ticketReservation($occurrence, [$item], 'pending');
        app(ConfirmTicketReservation::class)->handle($pendingReservation, [...$buyer, 'buyer_name' => 'Compra Pendiente']);

        $expiredSelection = $this->ticketReservation($occurrence, [$item], 'expired-selection');
        $expiredSelection->update(['selection_expires_at' => now()->subMinute()]);
        $expiredPaymentReservation = $this->ticketReservation($occurrence, [$item], 'expired-payment');
        $expiredTicketPayment = app(ConfirmTicketReservation::class)->handle($expiredPaymentReservation, [...$buyer, 'buyer_name' => 'Reserva Vencida']);
        $expiredPaymentReservation->update(['payment_expires_at' => now()->subMinute()]);
        $expiredTicketPayment->update(['qr_expires_at' => now()->subMinute()]);

        $lateReservation = $this->ticketReservation($occurrence, [$item], 'late-payment');
        $latePayment = app(ConfirmTicketReservation::class)->handle($lateReservation, [...$buyer, 'buyer_name' => 'Pago Tardío']);
        $lateReservation->update(['payment_expires_at' => now()->subMinute()]);
        $latePayment->update(['qr_expires_at' => now()->subMinute()]);

        $courtesyTicket = app(IssueCourtesyTickets::class)->handle($occurrence, [
            'recipient_name' => 'Invitado Multiuso',
            'recipient_email' => 'invitado@example.com',
            'recipient_phone' => '+591 70101010',
            'reason' => 'Prueba de acceso para grupo de tres personas',
            'items' => [[...$item, 'quantity' => 3]],
        ], $admin->id);
        app(ScanTicket::class)->handle($occurrence, app(TicketQrToken::class)->for($courtesyTicket->id), $scanner);

        $polera = ProductVariant::query()->where('sku', 'EV-POL-NEG-S')->firstOrFail();
        $gorra = ProductVariant::query()->where('sku', 'EV-GOR-001')->firstOrFail();
        $vaso = ProductVariant::query()->where('sku', 'EV-VAS-001')->firstOrFail();
        $llavero = ProductVariant::query()->where('sku', 'EV-LLA-001')->firstOrFail();

        $paidOrderPayment = $this->productOrder($company, [
            ['product_variant_id' => $polera->id, 'quantity' => 2],
            ['product_variant_id' => $gorra->id, 'quantity' => 1],
        ], 'Pedido Web Pagado Multiproducto');
        app(ConfirmPayment::class)->handle($paidOrderPayment, 'BANK-ORDER-PAID-001', 'EVENT-ORDER-PAID-001', 'demo_seed');
        $this->productOrder($company, [['product_variant_id' => $gorra->id, 'quantity' => 2]], 'Pedido Web Pendiente');
        $expiredOrderPayment = $this->productOrder($company, [['product_variant_id' => $vaso->id, 'quantity' => 1]], 'Pedido Web Vencido');
        ProductOrder::query()->where('sale_id', $expiredOrderPayment->sale_id)->update(['payment_expires_at' => now()->subMinute()]);
        $expiredOrderPayment->update(['qr_expires_at' => now()->subMinute()]);

        $register = CashRegister::query()->where('is_primary', true)->firstOrFail();
        $cashSession = app(OpenCashSession::class)->handle($register, $admin, '500.00');
        CashMovement::query()->create(['cash_session_id' => $cashSession->id, 'movement_type' => 'manual', 'direction' => 'in', 'amount' => '100.00', 'description' => 'Refuerzo de fondo de cambio', 'created_by_user_id' => $admin->id, 'authorized_by_user_id' => $admin->id]);
        CashMovement::query()->create(['cash_session_id' => $cashSession->id, 'movement_type' => 'manual', 'direction' => 'out', 'amount' => '35.00', 'description' => 'Gasto operativo documentado', 'created_by_user_id' => $admin->id, 'authorized_by_user_id' => $admin->id]);

        $paidPosPayment = app(CreatePosSale::class)->handle($company, $cashSession, $seller, [['product_variant_id' => $llavero->id, 'quantity' => 2]]);
        app(ConfirmPayment::class)->handle($paidPosPayment, 'BANK-POS-PAID-001', 'EVENT-POS-PAID-001', 'demo_seed');
        app(CreatePosSale::class)->handle($company, $cashSession, $seller, [['product_variant_id' => $vaso->id, 'quantity' => 2]]);
        $expiredPosPayment = app(CreatePosSale::class)->handle($company, $cashSession, $seller, [['product_variant_id' => $llavero->id, 'quantity' => 1]]);
        $expiredPosPayment->update(['qr_expires_at' => now()->subMinute()]);

        app(ReleaseExpiredHolds::class)->handle();
        app(ConfirmPayment::class)->handle($latePayment, 'BANK-LATE-001', 'EVENT-LATE-001', 'demo_seed');

        $poster = ProductVariant::query()->where('sku', 'EV-POS-001')->firstOrFail();
        app(AdjustInventory::class)->handle($poster, -5, 'Ajuste demo para disparar alerta de stock bajo', $admin, 'correction');

        AuditLog::query()->create(['company_id' => $company->id, 'actor_user_id' => $admin->id, 'action' => 'demo.seeded', 'entity_type' => 'company', 'entity_id' => $company->id, 'after_json' => ['flows' => ['ticket_paid', 'ticket_pending', 'ticket_expired', 'late_payment', 'courtesy_multiuse', 'product_paid', 'product_pending', 'product_expired', 'pos_paid', 'pos_pending', 'pos_expired', 'low_stock']], 'reason' => 'Datos de prueba integrales']);
    }

    /** @param array<int, array{event_location_id: string, ticket_type_id: string, quantity: int}> $items */
    private function ticketReservation(mixed $occurrence, array $items, string $suffix): TicketReservation
    {
        return app(CreateTicketReservation::class)->handle($occurrence, $items, 'demo-session-token-'.$suffix.'-000000000000');
    }

    /** @param array<int, array{product_variant_id: string, quantity: int}> $items */
    private function productOrder(Company $company, array $items, string $buyerName): PaymentAttempt
    {
        return app(CreateProductOrder::class)->handle($company, [
            'buyer_name' => $buyerName,
            'buyer_email' => 'cliente@example.com',
            'buyer_phone' => '+591 71234567',
            'buyer_identity_document' => 'CI-DEMO-001',
            'items' => $items,
        ], null, 'demo-product-session-'.str()->slug($buyerName));
    }
}
