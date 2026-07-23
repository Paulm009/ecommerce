<?php

declare(strict_types=1);

use App\Models\Company;
use App\Models\CompanySetting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('company settings page is accessible by staff user', function () {
    $company = Company::factory()->create();
    $user = User::factory()->staff()->create(['company_id' => $company->id]);

    $response = $this->actingAs($user)->get(route('company-settings.edit'));

    $response->assertOk();
    $response->assertInertia(fn ($page) => $page->component('settings/company'));
});

test('company settings page redirects for guests', function () {
    $response = $this->get(route('company-settings.edit'));

    $response->assertRedirect(route('login'));
});

test('company settings can be updated by staff user', function () {
    $company = Company::factory()->create();
    CompanySetting::create([
        'company_id' => $company->id,
        'currency_code' => 'BOB',
        'timezone' => 'America/La_Paz',
    ]);
    $user = User::factory()->staff()->create(['company_id' => $company->id]);

    $response = $this->actingAs($user)->patch(route('company-settings.update'), [
        'company_name' => 'Test Company',
        'company_currency' => 'BOB',
        'company_timezone' => 'America/La_Paz',
        'ticket_temporary_minutes' => 5,
        'ticket_payment_minutes' => 20,
    ]);

    $response->assertRedirect(route('company-settings.edit'));
    $response->assertSessionHas('success');

    $company->refresh();
    expect($company->commercial_name)->toBe('Test Company');
    expect($company->settings->currency_code)->toBe('BOB');
    expect($company->settings->temporary_selection_minutes)->toBe(5);
    expect($company->settings->payment_reservation_minutes)->toBe(20);
});

test('company settings update validates required fields', function () {
    $company = Company::factory()->create();
    $user = User::factory()->staff()->create(['company_id' => $company->id]);

    $response = $this->actingAs($user)->patch(route('company-settings.update'), []);

    $response->assertSessionHasErrors(['company_name', 'company_currency', 'company_timezone', 'ticket_temporary_minutes', 'ticket_payment_minutes']);
});

test('company settings update validates timezone', function () {
    $company = Company::factory()->create();
    $user = User::factory()->staff()->create(['company_id' => $company->id]);

    $response = $this->actingAs($user)->patch(route('company-settings.update'), [
        'company_name' => 'Test',
        'company_currency' => 'BOB',
        'company_timezone' => 'Invalid/Timezone',
        'ticket_temporary_minutes' => 5,
        'ticket_payment_minutes' => 20,
    ]);

    $response->assertSessionHasErrors('company_timezone');
});

test('user factory creates users with correct default type', function () {
    $user = User::factory()->create();

    expect($user->user_type)->toBe('customer');
});

test('staff factory state works', function () {
    $user = User::factory()->staff()->create();

    expect($user->user_type)->toBe('staff');
    expect($user->isStaff())->toBeTrue();
});
