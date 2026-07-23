<?php

declare(strict_types=1);

namespace App\Http\Controllers\Settings;

use App\Http\Controllers\Controller;
use App\Models\Company;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CompanySettingsController extends Controller
{
    public function edit(): Response
    {
        Gate::authorize('manage-company-settings');

        $company = Company::with('settings')->first();
        $cs = $company?->settings;

        $settings = [
            'company_name' => $company?->commercial_name ?? '',
            'company_currency' => $cs?->currency_code ?? 'BOB',
            'company_timezone' => $cs?->timezone ?? 'America/La_Paz',
            'company_contact_email' => $company?->contact_email ?? '',
            'company_contact_phone' => $company?->contact_phone ?? '',
            'company_colors' => [
                'primary' => $cs?->primary_color ?? '#f53003',
                'secondary' => $cs?->secondary_color ?? '#1b1b18',
            ],
            'ticket_temporary_minutes' => (string) ($cs?->temporary_selection_minutes ?? 5),
            'ticket_payment_minutes' => (string) ($cs?->payment_reservation_minutes ?? 20),
            'company_terms' => '',
            'company_privacy_policy' => '',
        ];

        return Inertia::render('settings/company', [
            'settings' => $settings,
        ]);
    }

    public function update(Request $request): RedirectResponse
    {
        Gate::authorize('manage-company-settings');

        $validated = $request->validate([
            'company_name' => ['required', 'string', 'max:180'],
            'company_colors' => ['nullable', 'array'],
            'company_colors.primary' => ['nullable', 'string', 'max:20'],
            'company_colors.secondary' => ['nullable', 'string', 'max:20'],
            'company_currency' => ['required', 'string', 'size:3'],
            'company_timezone' => ['required', 'string', 'max:80', Rule::in(timezone_identifiers_list())],
            'company_contact_email' => ['nullable', 'email', 'max:180'],
            'company_contact_phone' => ['nullable', 'string', 'max:40'],
            'ticket_temporary_minutes' => ['required', 'integer', 'min:1', 'max:60'],
            'ticket_payment_minutes' => ['required', 'integer', 'min:1', 'max:120'],
            'company_terms' => ['nullable', 'string'],
            'company_privacy_policy' => ['nullable', 'string'],
        ]);

        $company = Company::first();

        if ($company) {
            $company->update([
                'commercial_name' => $validated['company_name'],
                'contact_email' => $validated['company_contact_email'] ?? $company->contact_email,
                'contact_phone' => $validated['company_contact_phone'] ?? $company->contact_phone,
            ]);

            $company->settings()->updateOrCreate(
                ['company_id' => $company->id],
                [
                    'currency_code' => $validated['company_currency'],
                    'timezone' => $validated['company_timezone'],
                    'temporary_selection_minutes' => $validated['ticket_temporary_minutes'],
                    'payment_reservation_minutes' => $validated['ticket_payment_minutes'],
                    'primary_color' => $validated['company_colors']['primary'] ?? null,
                    'secondary_color' => $validated['company_colors']['secondary'] ?? null,
                    'support_email' => $validated['company_contact_email'] ?? null,
                    'support_phone' => $validated['company_contact_phone'] ?? null,
                    'updated_by_user_id' => $request->user()?->id,
                ],
            );
        }

        return to_route('company-settings.edit')
            ->with('success', __('Company settings updated successfully.'));
    }
}
