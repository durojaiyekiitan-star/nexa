"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import CountrySelect from "@/components/CountrySelect";
import WalletSetupGuide from "@/components/WalletSetupGuide";
import { isValidWalletInput, normalizeWalletAddress } from "@/lib/utils/wallet";

export default function SettingsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Personal details
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [country, setCountry] = useState("");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsMessage, setDetailsMessage] = useState("");

  // ILP wallet
  const [walletAddress, setWalletAddress] = useState("");
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletMessage, setWalletMessage] = useState("");

  // Password
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();

    const load = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.id);

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, middle_name, last_name, country, ilp_wallet_address")
        .eq("id", user.id)
        .single();

      if (profile) {
        setFirstName(profile.first_name ?? "");
        setMiddleName(profile.middle_name ?? "");
        setLastName(profile.last_name ?? "");
        setCountry(profile.country ?? "");
        setWalletAddress(profile.ilp_wallet_address ?? "");
      }
      setLoading(false);
    };

    load();
  }, [router]);

  const saveDetails = async () => {
    if (!userId || !firstName.trim() || !lastName.trim()) return;
    setSavingDetails(true);
    setDetailsMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        first_name: firstName.trim(),
        middle_name: middleName.trim() || null,
        last_name: lastName.trim(),
        country: country || null,
      })
      .eq("id", userId);
    setDetailsMessage(error ? error.message : "Saved.");
    setSavingDetails(false);
  };

  const saveWallet = async () => {
    if (!userId) return;
    if (walletAddress.trim() && !isValidWalletInput(walletAddress)) {
      setWalletMessage("That doesn't look like a valid wallet address — should look like $ilp.interledger-test.dev/yourname");
      return;
    }
    setSavingWallet(true);
    setWalletMessage("");
    const supabase = createClient();
    const { error } = await supabase
      .from("profiles")
      .update({ ilp_wallet_address: walletAddress.trim() ? normalizeWalletAddress(walletAddress) : null })
      .eq("id", userId);
    setWalletMessage(error ? error.message : "Saved.");
    setSavingWallet(false);
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      setPasswordMessage("Password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordMessage("Passwords don't match.");
      return;
    }
    setSavingPassword(true);
    setPasswordMessage("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      setPasswordMessage(error.message);
    } else {
      setPasswordMessage("Password updated.");
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPassword(false);
  };

  if (loading) return null;

  return (
    <main className="min-h-screen relative z-10 px-6 py-12">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Account Settings</h1>
          <p className="text-sm text-purple-200/60">Manage your personal details, wallet, and password.</p>
        </div>

        {/* Personal details */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
          <h2 className="font-semibold text-white mb-4">Personal details</h2>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">First name</label>
              <input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Middle</label>
              <input
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Last name</label>
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
              />
            </div>
          </div>
          <div className="mb-4">
            <label className="text-sm font-medium text-purple-100 mb-1 block">Country</label>
            <CountrySelect value={country} onChange={setCountry} />
          </div>
          <button
            onClick={saveDetails}
            disabled={savingDetails || !firstName.trim() || !lastName.trim()}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            {savingDetails ? "Saving..." : "Save details"}
          </button>
          {detailsMessage && <p className="text-sm text-purple-200/60 mt-2">{detailsMessage}</p>}
        </div>

        {/* ILP wallet */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
          <h2 className="font-semibold text-white mb-1">Interledger wallet address</h2>
          <p className="text-xs text-purple-300/50 mb-4">
            Link your personal Interledger wallet — this is what real Interledger payments to or from your account
            actually use.
          </p>
          <input
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            placeholder="$ilp.interledger-test.dev/yourname"
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-purple-300/40 focus:border-cyan-400/50 outline-none mb-3"
          />
          <div className="mb-4">
            <WalletSetupGuide />
          </div>
          <button
            onClick={saveWallet}
            disabled={savingWallet}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            {savingWallet ? "Saving..." : "Save wallet address"}
          </button>
          {walletMessage && <p className="text-sm text-purple-200/60 mt-2">{walletMessage}</p>}
        </div>

        {/* Password */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl shadow-[0_8px_32px_rgba(139,92,246,0.15)] p-6">
          <h2 className="font-semibold text-white mb-4">Change password</h2>
          <div className="space-y-3 mb-4">
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">New password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
                placeholder="At least 6 characters"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-purple-100 mb-1 block">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-cyan-400/50 outline-none"
              />
            </div>
          </div>
          <button
            onClick={savePassword}
            disabled={savingPassword || !newPassword}
            className="bg-gradient-to-r from-indigo-500 to-violet-500 disabled:opacity-40 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all hover:from-indigo-400 hover:to-violet-400 shadow-[0_0_16px_rgba(139,92,246,0.35)]"
          >
            {savingPassword ? "Updating..." : "Update password"}
          </button>
          {passwordMessage && <p className="text-sm text-purple-200/60 mt-2">{passwordMessage}</p>}
        </div>
      </div>
    </main>
  );
}
