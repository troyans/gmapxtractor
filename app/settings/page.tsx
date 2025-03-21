'use client';

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import MainLayout from '@/components/layout/MainLayout';

export default function SettingsPage() {
  const [fullName, setFullName] = useState('John Doe');
  const [email, setEmail] = useState('john@example.com');
  const [company, setCompany] = useState('Acme Inc');
  const [phone, setPhone] = useState('(555) 123-4567');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const supabase = createClientComponentClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          full_name: fullName,
          company,
          phone,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-gray-500">Manage your account settings and preferences</p>
        </div>

        {/* Tabs */}
        <div className="flex border-b mb-6">
          <button className="px-6 py-2 border-b-2 border-black text-sm font-medium">
            Account
          </button>
          <button className="px-6 py-2 text-gray-500 text-sm font-medium">
            Security
          </button>
          <button className="px-6 py-2 text-gray-500 text-sm font-medium">
            Notifications
          </button>
          <button className="px-6 py-2 text-gray-500 text-sm font-medium">
            Billing
          </button>
        </div>

        {/* Profile Information */}
        <Card className="p-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold">Profile Information</h2>
            <p className="text-gray-500">Update your account profile information</p>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label htmlFor="fullName" className="block text-sm font-medium mb-2">
                  Full Name
                </label>
                <Input
                  id="fullName"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled
                />
              </div>
              <div>
                <label htmlFor="company" className="block text-sm font-medium mb-2">
                  Company
                </label>
                <Input
                  id="company"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              className="bg-black text-white hover:bg-gray-800"
              disabled={isSaving}
            >
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </MainLayout>
  );
} 