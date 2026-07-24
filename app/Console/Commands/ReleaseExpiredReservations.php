<?php

declare(strict_types=1);

namespace App\Console\Commands;

use App\Actions\Operations\ReleaseExpiredHolds;
use Illuminate\Console\Command;

class ReleaseExpiredReservations extends Command
{
    protected $signature = 'platform:release-expired';

    protected $description = 'Libera ubicaciones y stock de pagos vencidos';

    public function handle(ReleaseExpiredHolds $releaseExpiredHolds): int
    {
        $counts = $releaseExpiredHolds->handle();
        $this->info(sprintf('Liberados: %d reservas, %d pedidos y %d ventas POS.', $counts['tickets'], $counts['product_orders'], $counts['pos_sales']));

        return self::SUCCESS;
    }
}
