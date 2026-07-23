<?php

declare(strict_types=1);

namespace App\Http\Controllers;

use App\Models\CashSession;
use App\Models\PaymentIncident;
use App\Models\ProductOrder;
use App\Models\ProductOrderItem;
use App\Models\Sale;
use App\Models\StockAlert;
use App\Models\Ticket;
use App\Models\TicketReservation;
use App\Models\TicketTypeInventory;
use App\Support\CurrentCompany;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

final class DashboardController extends Controller
{
    public function __invoke(Request $request, CurrentCompany $currentCompany): Response
    {
        $company = $currentCompany->get();
        $from = $request->date('from')?->startOfDay() ?? now()->subDays(30)->startOfDay();
        $to = $request->date('to')?->endOfDay() ?? now()->endOfDay();
        $sales = Sale::query()->where('company_id', $company->id)->where('status', 'paid')->whereBetween('paid_at', [$from, $to]);
        $productProfit = ProductOrderItem::query()
            ->whereHas('order.sale', fn ($query) => $query
                ->where('company_id', $company->id)
                ->where('status', 'paid')
                ->whereBetween('paid_at', [$from, $to]))
            ->sum('profit_amount');

        return Inertia::render('dashboard', [
            'filters' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'metrics' => [
                'totalSales' => (string) (clone $sales)->sum('total_amount'),
                'eventRevenue' => (string) (clone $sales)->where('sale_type', 'tickets')->sum('total_amount'),
                'productRevenue' => (string) (clone $sales)->where('sale_type', 'products')->sum('total_amount'),
                'productProfit' => (string) $productProfit,
                'ticketsSold' => Ticket::query()->whereNotNull('ticket_order_id')->whereBetween('issued_at', [$from, $to])->sum('quota_total'),
                'courtesyTickets' => Ticket::query()->whereNotNull('courtesy_batch_id')->whereBetween('issued_at', [$from, $to])->sum('quota_total'),
                'ticketsUsed' => Ticket::query()->whereBetween('issued_at', [$from, $to])->sum('quota_used'),
                'ticketsAvailable' => TicketTypeInventory::query()->sum('available_quantity'),
                'pendingReservations' => TicketReservation::query()->whereIn('status', ['temporary_selection', 'pending_payment'])->count(),
                'pendingOrders' => ProductOrder::query()->where('status', 'pending_payment')->count(),
                'lowStockProducts' => StockAlert::query()->where('status', 'open')->count(),
                'paymentIncidents' => PaymentIncident::query()->where('status', 'open')->count(),
            ],
            'cashSession' => CashSession::query()
                ->with('register:id,name')
                ->where('status', 'open')
                ->latest('opened_at')
                ->first(['id', 'cash_register_id', 'session_number', 'opened_by_user_id', 'opened_at', 'opening_amount']),
        ]);
    }
}
