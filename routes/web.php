<?php

declare(strict_types=1);

use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\InventoryController;
use App\Http\Controllers\Admin\LayoutController;
use App\Http\Controllers\Admin\OrderController;
use App\Http\Controllers\Admin\PaymentIncidentController;
use App\Http\Controllers\Admin\ProductController as AdminProductController;
use App\Http\Controllers\Admin\TicketController as AdminTicketController;
use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\CustomerAccountController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Operations\CashController;
use App\Http\Controllers\Operations\CourtesyController;
use App\Http\Controllers\Operations\PosController;
use App\Http\Controllers\Operations\ScannerController;
use App\Http\Controllers\Public\EventCatalogController;
use App\Http\Controllers\Public\EventReservationController;
use App\Http\Controllers\Public\PaymentController;
use App\Http\Controllers\Public\ProductCheckoutController;
use App\Http\Controllers\Public\StoreCatalogController;
use App\Http\Controllers\Public\TicketViewController;
use App\Http\Controllers\Webhooks\BankPaymentWebhookController;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Route;

Route::inertia('/', 'welcome')->name('home');
Route::get('events', [EventCatalogController::class, 'index'])->name('events.index');
Route::get('events/{event:slug}', [EventCatalogController::class, 'show'])->name('events.show');
Route::post('events/occurrences/{occurrence}/reservations', [EventReservationController::class, 'store'])->name('reservations.store');
Route::get('reservations/{reservation}', [EventReservationController::class, 'show'])->name('reservations.show');
Route::post('reservations/{reservation}/confirm', [EventReservationController::class, 'confirm'])->name('reservations.confirm');

Route::get('store', [StoreCatalogController::class, 'index'])->name('store.index');
Route::inertia('store/cart', 'store/cart')->name('store.cart');
Route::get('store/{product:slug}', [StoreCatalogController::class, 'show'])->name('store.show');
Route::post('checkout/products', [ProductCheckoutController::class, 'store'])->name('product-orders.store');

Route::get('payments/{paymentAttempt}', [PaymentController::class, 'show'])->name('payments.show');
Route::get('payments/{paymentAttempt}/status', [PaymentController::class, 'status'])->name('payments.status');
Route::post('payments/{paymentAttempt}/simulate', [PaymentController::class, 'simulate'])->name('payments.simulate');
Route::get('tickets/{ticket:public_code}', TicketViewController::class)->name('tickets.show');
Route::post('webhooks/bank/payments', BankPaymentWebhookController::class)->name('webhooks.bank.payments');

Route::middleware(['auth', 'verified'])->group(function (): void {
    Route::get('account', CustomerAccountController::class)->name('account');
    Route::get('dashboard', DashboardController::class)->middleware('permission:dashboard.view')->name('dashboard');

    Route::prefix('admin')->name('admin.')->group(function (): void {
        Route::middleware('permission:events.manage')->group(function (): void {
            Route::get('events', [AdminEventController::class, 'index'])->name('events.index');
            Route::post('events', [AdminEventController::class, 'store'])->name('events.store');
            Route::patch('events/{event}', [AdminEventController::class, 'update'])->name('events.update');
            Route::patch('events/{event}/status', [AdminEventController::class, 'status'])->name('events.status');
            Route::post('events/{event}/promotions', [AdminEventController::class, 'promotion'])->name('events.promotions.store');
        });
        Route::middleware('permission:products.manage')->group(function (): void {
            Route::get('products', [AdminProductController::class, 'index'])->name('products.index');
            Route::post('products', [AdminProductController::class, 'store'])->name('products.store');
            Route::patch('products/{product}/status', [AdminProductController::class, 'toggle'])->name('products.toggle');
        });
        Route::get('tickets', [AdminTicketController::class, 'index'])->middleware('permission:tickets.view')->name('tickets.index');
        Route::post('tickets/{ticket}/resend', [AdminTicketController::class, 'resend'])->middleware('permission:tickets.view')->name('tickets.resend');
        Route::patch('tickets/{ticket}/void', [AdminTicketController::class, 'void'])->middleware('permission:tickets.void')->name('tickets.void');
        Route::get('orders', [OrderController::class, 'index'])->middleware('permission:orders.manage')->name('orders.index');
        Route::patch('orders/{productOrder}/deliver', [OrderController::class, 'deliver'])->middleware('permission:orders.manage')->name('orders.deliver');
        Route::get('inventory', [InventoryController::class, 'index'])->middleware('permission:inventory.view')->name('inventory.index');
        Route::post('inventory/adjustments', [InventoryController::class, 'adjust'])->middleware('permission:inventory.adjust')->name('inventory.adjust');
        Route::get('payment-incidents', [PaymentIncidentController::class, 'index'])->middleware('permission:payments.review_incidents')->name('payments.index');
        Route::patch('payment-incidents/{paymentIncident}/resolve', [PaymentIncidentController::class, 'resolve'])->middleware('permission:payments.review_incidents')->name('payments.resolve');
        Route::get('layouts', [LayoutController::class, 'index'])->middleware('permission:layouts.manage')->name('layouts.index');
        Route::post('layouts', [LayoutController::class, 'store'])->middleware('permission:layouts.manage')->name('layouts.store');
        Route::patch('layouts/{layoutTemplate}/toggle', [LayoutController::class, 'toggle'])->middleware('permission:layouts.manage')->name('layouts.toggle');
        Route::get('users', [UserController::class, 'index'])->middleware('permission:users.manage')->name('users.index');
        Route::post('users', [UserController::class, 'store'])->middleware('permission:users.manage')->name('users.store');
        Route::patch('users/{user}/toggle', [UserController::class, 'toggle'])->middleware('permission:users.manage')->name('users.toggle');
    });

    Route::get('pos', [PosController::class, 'index'])->middleware('permission:pos.sell')->name('pos.index');
    Route::post('pos/sales', [PosController::class, 'store'])->middleware('permission:pos.sell')->name('pos.sales.store');
    Route::get('cash', [CashController::class, 'index'])->middleware('permission:cash.manage')->name('cash.index');
    Route::post('cash/open', [CashController::class, 'open'])->middleware('permission:cash.manage')->name('cash.open');
    Route::post('cash/{cashSession}/movements', [CashController::class, 'movement'])->middleware('permission:cash.manage')->name('cash.movements.store');
    Route::post('cash/{cashSession}/close', [CashController::class, 'close'])->middleware('permission:cash.manage')->name('cash.close');
    Route::get('scanner', [ScannerController::class, 'index'])->middleware('permission:access.scan')->name('scanner.index');
    Route::post('scanner/{occurrence}', [ScannerController::class, 'scan'])->middleware('permission:access.scan')->name('scanner.scan');
    Route::get('courtesies', [CourtesyController::class, 'index'])->middleware('permission:tickets.issue_courtesy')->name('courtesies.index');
    Route::post('courtesies/{occurrence}', [CourtesyController::class, 'store'])->middleware('permission:tickets.issue_courtesy')->name('courtesies.store');
});

Route::get('deploy', function (): JsonResponse {
    $gitDir = base_path('.git');
    $hash = null;
    $date = null;

    if (is_dir($gitDir)) {
        $head = @file_get_contents("{$gitDir}/HEAD");
        if ($head !== false) {
            $ref = trim(str_replace('ref: ', '', $head));
            $refPath = "{$gitDir}/{$ref}";
            if (is_file($refPath)) {
                $hash = trim((string) @file_get_contents($refPath));
            } elseif (is_file("{$gitDir}/packed-refs")) {
                $packed = (string) @file_get_contents("{$gitDir}/packed-refs");
                if (preg_match('/^([a-f0-9]+)\s+'.preg_quote($ref, '/').'/m', $packed, $m)) {
                    $hash = $m[1];
                }
            }

            if ($hash && is_file("{$gitDir}/logs/{$ref}")) {
                $log = (string) @file_get_contents("{$gitDir}/logs/{$ref}");
                $lines = array_filter(explode("\n", $log));
                $last = end($lines);
                if ($last && preg_match('/^[a-f0-9]+\s+[a-f0-9]+\s+.*?\s+(\d+)\s+/', $last, $m)) {
                    $date = date('c', (int) $m[1]);
                }
            }
        }
    }

    return response()->json([
        'version' => $hash ? substr($hash, 0, 8) : 'unknown',
        'commit' => $hash,
        'deployed_at' => $date ?? now()->toIso8601String(),
        'environment' => app()->environment(),
        'laravel' => app()->version(),
        'php' => PHP_VERSION,
    ]);
})->name('deploy');

require __DIR__.'/settings.php';
