<?php

declare(strict_types=1);

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Users\StoreUserRequest;
use App\Models\Role;
use App\Models\User;
use App\Support\CurrentCompany;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

final class UserController extends Controller
{
    public function index(CurrentCompany $currentCompany): Response
    {
        return Inertia::render('admin/users/index', [
            'users' => User::query()->with('roles:id,name,code')->where('company_id', $currentCompany->get()->id)->latest()->paginate(25),
            'roles' => Role::query()->where('company_id', $currentCompany->get()->id)->orderBy('name')->get(['id', 'name', 'code']),
        ]);
    }

    public function store(StoreUserRequest $request, CurrentCompany $currentCompany): RedirectResponse
    {
        $data = $request->validated();
        DB::transaction(function () use ($request, $currentCompany, $data): void {
            $user = User::query()->create([
                'company_id' => $currentCompany->get()->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'phone' => $data['phone'] ?? null,
                'password' => $data['password'],
                'user_type' => 'staff',
                'email_verified_at' => now(),
            ]);
            $user->roles()->sync(collect($data['role_ids'])->mapWithKeys(fn (string $roleId): array => [$roleId => ['assigned_by_user_id' => $request->user()->id, 'assigned_at' => now()]])->all());
        });

        return back()->with('success', 'Usuario interno creado.');
    }

    public function toggle(User $user, Request $request): RedirectResponse
    {
        abort_if($user->is($request->user()), 422, 'No puedes desactivar tu propio usuario.');
        $user->update(['status' => $user->status === 'active' ? 'inactive' : 'active']);

        return back()->with('success', 'Estado del usuario actualizado.');
    }
}
