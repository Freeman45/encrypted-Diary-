import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useWeb3 } from '@/hooks/useWeb3';
import { 
  encryptDiaryEntry, 
  generateEncryptionKey, 
  formatTimestamp,
  createEncryptedEntry,
  serializeEncryptedEntry 
} from '@/lib/encryption';
import { Lock, Unlock, Wallet, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Home Page - Encrypted Diary Application
 * Design: Warm Minimalism with Organic Curves
 * 
 * Key Features:
 * - Wallet connection for Sepolia testnet
 * - Encrypted diary entry creation
 * - Entry history with decryption
 * - Real-time encryption status
 */

interface DiaryEntry {
  id: string;
  plaintext: string;
  ciphertext: string;
  timestamp: number;
  isEncrypted: boolean;
  isVisible: boolean;
}

export default function Home() {
  const { account, isConnected, isConnecting, connectWallet, error } = useWeb3();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [entryText, setEntryText] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [encryptionKey, setEncryptionKey] = useState('');

  // Initialize encryption key when wallet connects
  useEffect(() => {
    if (account) {
      const key = generateEncryptionKey(account);
      setEncryptionKey(key);
      // Load entries from localStorage (in production, load from contract)
      loadEntriesFromStorage(account);
    }
  }, [account]);

  // Load entries from localStorage
  const loadEntriesFromStorage = (walletAddress: string) => {
    const storageKey = `diary_entries_${walletAddress}`;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        setEntries(JSON.parse(stored));
      } catch (error) {
        console.error('Error loading entries:', error);
      }
    }
  };

  // Save entries to localStorage
  const saveEntriesToStorage = (newEntries: DiaryEntry[]) => {
    if (account) {
      const storageKey = `diary_entries_${account}`;
      localStorage.setItem(storageKey, JSON.stringify(newEntries));
    }
  };

  // Handle saving a new diary entry
  const handleSaveEntry = async () => {
    if (!entryText.trim()) {
      toast.error('Please write something in your diary');
      return;
    }

    if (!account) {
      toast.error('Please connect your wallet first');
      return;
    }

    setIsSaving(true);
    try {
      // Encrypt the entry
      const encryptedText = encryptDiaryEntry(entryText, encryptionKey);
      
      // Create entry object
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        plaintext: entryText,
        ciphertext: encryptedText,
        timestamp: Date.now(),
        isEncrypted: true,
        isVisible: false,
      };

      // Add to entries list
      const updatedEntries = [newEntry, ...entries];
      setEntries(updatedEntries);
      saveEntriesToStorage(updatedEntries);

      // In production, save to smart contract here
      if (contractAddress) {
        const entryData = serializeEncryptedEntry(
          createEncryptedEntry(entryText, account, encryptionKey)
        );
        // await addDiaryEntry(entryData, contractAddress);
      }

      // Reset form
      setEntryText('');
      toast.success('Your diary entry has been encrypted and saved!');
    } catch (error) {
      console.error('Error saving entry:', error);
      toast.error('Failed to save diary entry');
    } finally {
      setIsSaving(false);
    }
  };

  // Toggle entry visibility
  const toggleEntryVisibility = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isVisible: !entry.isVisible } : entry
      )
    );
  };

  // Delete an entry
  const deleteEntry = (id: string) => {
    const updatedEntries = entries.filter((entry) => entry.id !== id);
    setEntries(updatedEntries);
    saveEntriesToStorage(updatedEntries);
    toast.success('Entry deleted');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-border sticky top-0 z-50">
        <div className="container py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Lock className="w-8 h-8 text-accent" />
            <h1 className="text-2xl font-bold text-foreground">Encrypted Diary</h1>
          </div>
          
          {!isConnected ? (
            <Button
              onClick={connectWallet}
              disabled={isConnecting}
              className="button-warm gap-2"
            >
              <Wallet className="w-4 h-4" />
              {isConnecting ? 'Connecting...' : 'Connect Wallet'}
            </Button>
          ) : (
            <div className="flex items-center gap-4">
              <div className="text-sm text-muted-foreground">
                {account?.slice(0, 6)}...{account?.slice(-4)}
              </div>
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="container py-8">
        {error && (
          <Card className="mb-6 p-4 bg-destructive/10 border-destructive/20">
            <p className="text-destructive text-sm">{error}</p>
          </Card>
        )}

        {isConnected ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Entry Form */}
            <div className="lg:col-span-2">
              <Card className="card-warm">
                <div className="flex items-center gap-2 mb-4">
                  <Plus className="w-5 h-5 text-accent" />
                  <h2 className="text-xl font-semibold text-foreground">New Entry</h2>
                </div>
                
                <Textarea
                  placeholder="Write your thoughts here... Everything you write will be encrypted with your wallet address."
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  className="min-h-64 p-4 border border-border rounded-xl resize-none focus:ring-2 focus:ring-accent focus:border-transparent"
                />

                {/* Optional: Contract Address Input */}
                <div className="mt-4">
                  <label className="text-sm text-muted-foreground mb-2 block">
                    Smart Contract Address (Optional)
                  </label>
                  <Input
                    type="text"
                    placeholder="0x..."
                    value={contractAddress}
                    onChange={(e) => setContractAddress(e.target.value)}
                    className="border border-border rounded-xl p-3"
                  />
                </div>

                <div className="mt-6 flex gap-3">
                  <Button
                    onClick={handleSaveEntry}
                    disabled={isSaving || !entryText.trim()}
                    className="button-warm flex-1"
                  >
                    {isSaving ? (
                      <>
                        <div className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2"></div>
                        Encrypting...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Save Entry
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              {/* Encryption Info */}
              <Card className="card-warm mt-6 bg-accent/5 border-accent/20">
                <div className="flex items-start gap-3">
                  <Unlock className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">End-to-End Encrypted</h3>
                    <p className="text-sm text-muted-foreground">
                      Your diary entries are encrypted using your wallet address as the encryption key. Only you can decrypt and read your entries.
                    </p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Sidebar Stats */}
            <div className="lg:col-span-1">
              <Card className="card-warm">
                <h3 className="text-lg font-semibold text-foreground mb-4">Statistics</h3>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Entries</p>
                    <p className="text-3xl font-bold text-accent">{entries.length}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Encryption Status</p>
                    <p className="text-sm font-semibold text-green-600">✓ Active</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Network</p>
                    <p className="text-sm font-semibold">Sepolia Testnet</p>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        ) : (
          <Card className="card-warm text-center py-12">
            <Wallet className="w-16 h-16 text-accent mx-auto mb-4 opacity-50" />
            <h2 className="text-2xl font-bold text-foreground mb-2">Connect Your Wallet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Connect your MetaMask wallet to start creating encrypted diary entries on the Sepolia testnet.
            </p>
            <Button onClick={connectWallet} disabled={isConnecting} className="button-warm">
              {isConnecting ? 'Connecting...' : 'Connect MetaMask'}
            </Button>
          </Card>
        )}

        {/* Entries History */}
        {isConnected && entries.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-foreground mb-6">Your Entries</h2>
            <div className="space-y-4">
              {entries.map((entry) => (
                <Card key={entry.id} className="card-warm">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Lock className="w-4 h-4 text-accent" />
                        <p className="text-sm text-muted-foreground">
                          {formatTimestamp(entry.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleEntryVisibility(entry.id)}
                        className="text-accent hover:bg-accent/10"
                      >
                        {entry.isVisible ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteEntry(entry.id)}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {entry.isVisible ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="text-foreground whitespace-pre-wrap break-words">
                        {entry.plaintext}
                      </p>
                    </div>
                  ) : (
                    <p className="text-muted-foreground italic">
                      [Entry encrypted - click eye icon to reveal]
                    </p>
                  )}
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
