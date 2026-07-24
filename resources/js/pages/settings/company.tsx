import { Form, Head } from '@inertiajs/react';
import { useState } from 'react';
import CompanySettingsController from '@/actions/App/Http/Controllers/Settings/CompanySettingsController';
import Heading from '@/components/heading';
import InputError from '@/components/input-error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type Props = {
    settings: Record<string, unknown>;
};

export default function CompanySettings({ settings }: Props) {
    const timezones = Intl.supportedValuesOf('timeZone');
    const colors =
        typeof settings.company_colors === 'object' &&
        settings.company_colors !== null
            ? (settings.company_colors as Record<string, string>)
            : {};

    const [currency, setCurrency] = useState(
        (settings.company_currency as string) ?? 'BOB',
    );
    const [timezone, setTimezone] = useState(
        (settings.company_timezone as string) ?? 'America/La_Paz',
    );

    return (
        <>
            <Head title="Company settings" />

            <div className="space-y-6">
                <Heading
                    variant="small"
                    title="Company settings"
                    description="Manage your company's configuration and defaults"
                />

                <Form
                    {...CompanySettingsController.update.form()}
                    options={{
                        preserveScroll: true,
                    }}
                    className="space-y-6"
                >
                    {({ processing, errors }) => (
                        <>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <div className="grid gap-2">
                                    <Label htmlFor="company_name">
                                        Company name
                                    </Label>
                                    <Input
                                        id="company_name"
                                        name="company_name"
                                        required
                                        placeholder="Your company name"
                                        defaultValue={
                                            (settings.company_name as string) ??
                                            ''
                                        }
                                    />
                                    <InputError message={errors.company_name} />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_currency">
                                        Currency
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="company_currency"
                                        value={currency}
                                    />
                                    <Select
                                        name="company_currency"
                                        value={currency}
                                        onValueChange={setCurrency}
                                    >
                                        <SelectTrigger
                                            id="company_currency"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select currency" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="BOB">
                                                BOB - Boliviano
                                            </SelectItem>
                                            <SelectItem value="USD">
                                                USD - US Dollar
                                            </SelectItem>
                                            <SelectItem value="EUR">
                                                EUR - Euro
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.company_currency}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_timezone">
                                        Timezone
                                    </Label>
                                    <input
                                        type="hidden"
                                        name="company_timezone"
                                        value={timezone}
                                    />
                                    <Select
                                        name="company_timezone"
                                        value={timezone}
                                        onValueChange={setTimezone}
                                    >
                                        <SelectTrigger
                                            id="company_timezone"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Select timezone" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {timezones.map((tz) => (
                                                <SelectItem key={tz} value={tz}>
                                                    {tz}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <InputError
                                        message={errors.company_timezone}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_contact_email">
                                        Contact email
                                    </Label>
                                    <Input
                                        id="company_contact_email"
                                        name="company_contact_email"
                                        type="email"
                                        placeholder="contact@company.com"
                                        defaultValue={
                                            (settings.company_contact_email as string) ??
                                            ''
                                        }
                                    />
                                    <InputError
                                        message={errors.company_contact_email}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="company_contact_phone">
                                        Contact phone
                                    </Label>
                                    <Input
                                        id="company_contact_phone"
                                        name="company_contact_phone"
                                        placeholder="+591 ..."
                                        defaultValue={
                                            (settings.company_contact_phone as string) ??
                                            ''
                                        }
                                    />
                                    <InputError
                                        message={errors.company_contact_phone}
                                    />
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <Heading
                                    variant="small"
                                    title="Ticket reservation times"
                                    description="Configure time limits for the ticket reservation flow"
                                />

                                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="ticket_temporary_minutes">
                                            Temporary selection (minutes)
                                        </Label>
                                        <Input
                                            id="ticket_temporary_minutes"
                                            name="ticket_temporary_minutes"
                                            type="number"
                                            min="1"
                                            max="60"
                                            required
                                            defaultValue={
                                                (settings.ticket_temporary_minutes as string) ??
                                                '5'
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Time before the user must confirm
                                            their seat selection.
                                        </p>
                                        <InputError
                                            message={
                                                errors.ticket_temporary_minutes
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="ticket_payment_minutes">
                                            Payment window (minutes)
                                        </Label>
                                        <Input
                                            id="ticket_payment_minutes"
                                            name="ticket_payment_minutes"
                                            type="number"
                                            min="1"
                                            max="120"
                                            required
                                            defaultValue={
                                                (settings.ticket_payment_minutes as string) ??
                                                '20'
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Time to complete payment after
                                            confirming the reservation.
                                        </p>
                                        <InputError
                                            message={
                                                errors.ticket_payment_minutes
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <Heading
                                    variant="small"
                                    title="Branding"
                                    description="Configure your company's visual identity"
                                />

                                <div className="mt-4 grid gap-6 sm:grid-cols-2">
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_colors_primary">
                                            Primary color
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="company_colors_primary"
                                                name="company_colors[primary]"
                                                type="color"
                                                className="h-10 w-16"
                                                defaultValue={
                                                    colors.primary ?? '#f53003'
                                                }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                Used for buttons, links, and
                                                accents.
                                            </span>
                                        </div>
                                        <InputError
                                            message={
                                                errors['company_colors.primary']
                                            }
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="company_colors_secondary">
                                            Secondary color
                                        </Label>
                                        <div className="flex items-center gap-3">
                                            <Input
                                                id="company_colors_secondary"
                                                name="company_colors[secondary]"
                                                type="color"
                                                className="h-10 w-16"
                                                defaultValue={
                                                    colors.secondary ??
                                                    '#1b1b18'
                                                }
                                            />
                                            <span className="text-sm text-muted-foreground">
                                                Used for headers and emphasis.
                                            </span>
                                        </div>
                                        <InputError
                                            message={
                                                errors[
                                                    'company_colors.secondary'
                                                ]
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t pt-6">
                                <Heading
                                    variant="small"
                                    title="Legal content"
                                    description="Terms and privacy policy displayed to buyers"
                                />

                                <div className="mt-4 grid gap-6">
                                    <div className="grid gap-2">
                                        <Label htmlFor="company_terms">
                                            Terms and conditions
                                        </Label>
                                        <Textarea
                                            id="company_terms"
                                            name="company_terms"
                                            rows={4}
                                            placeholder="Enter your terms and conditions..."
                                            defaultValue={
                                                (settings.company_terms as string) ??
                                                ''
                                            }
                                        />
                                        <InputError
                                            message={errors.company_terms}
                                        />
                                    </div>

                                    <div className="grid gap-2">
                                        <Label htmlFor="company_privacy_policy">
                                            Privacy policy
                                        </Label>
                                        <Textarea
                                            id="company_privacy_policy"
                                            name="company_privacy_policy"
                                            rows={4}
                                            placeholder="Enter your privacy policy..."
                                            defaultValue={
                                                (settings.company_privacy_policy as string) ??
                                                ''
                                            }
                                        />
                                        <InputError
                                            message={
                                                errors.company_privacy_policy
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <Button type="submit" disabled={processing}>
                                    Save settings
                                </Button>
                            </div>
                        </>
                    )}
                </Form>
            </div>
        </>
    );
}
