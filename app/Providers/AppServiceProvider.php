<?php

declare(strict_types=1);

namespace App\Providers;

use App\Contracts\Payments\QrPaymentGateway;
use App\Models\User;
use App\Payments\FakeQrPaymentGateway;
use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->bind(QrPaymentGateway::class, FakeQrPaymentGateway::class);
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureGates();
    }

    /**
     * Configure default behaviors for production-ready applications.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(fn (): ?Password => app()->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null,
        );
    }

    /**
     * Configure authorization gates.
     */
    protected function configureGates(): void
    {
        Gate::before(function (User $user): ?bool {
            return $user->roles()->where('code', 'global_admin')->exists() ? true : null;
        });

        Gate::define('manage-company-settings', fn (User $user): bool => $user->isStaff());
    }
}
