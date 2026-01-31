import { QueryProvider } from './app/providers/QueryProvider';
import { ThemeProvider } from './app/providers/ThemeProvider';
import { WagmiProviderWrapper } from './app/providers/WagmiProvider';
import { ConnectButton } from './components/wallet/ConnectButton';
import { AdrianZeroModule } from './features/adrianzero/components/AdrianZeroModule';

function App() {
  return (
    <ThemeProvider>
      <QueryProvider>
        <WagmiProviderWrapper>
          <div className="min-h-screen bg-background text-foreground">
            <header className="border-b border-border">
              <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h1 className="text-2xl font-bold">TraitLAB V4</h1>
                    <p className="text-sm text-muted-foreground">AdrianZERO NFT Management</p>
                  </div>
                  <ConnectButton />
                </div>
              </div>
            </header>
            <main className="container mx-auto px-4 py-8">
              <AdrianZeroModule />
            </main>
          </div>
        </WagmiProviderWrapper>
      </QueryProvider>
    </ThemeProvider>
  );
}

export default App;
