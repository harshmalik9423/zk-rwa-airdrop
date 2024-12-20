/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable no-console */

'use client';

import {
  CHAIN_NAMESPACES,
  IAdapter,
  IProvider,
  WEB3AUTH_NETWORK,
} from '@web3auth/base';
import { EthereumPrivateKeyProvider } from '@web3auth/ethereum-provider';
import { getDefaultExternalAdapters } from '@web3auth/default-evm-adapter';
import { Web3Auth, Web3AuthOptions } from '@web3auth/modal';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import RPC from './ethersRPC';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MountainIcon } from 'lucide-react';
import { ethers } from 'ethers';
import { AIRDROP_CONTRACT_ABI } from '@/constants/contractABI';

const clientId = process.env.NEXT_PUBLIC_WEB3AUTH_CLIENT_ID;

const chainConfig = {
  chainNamespace: CHAIN_NAMESPACES.EIP155,
  chainId: '0x128',
  rpcTarget: 'https://testnet.hashio.io/api',
  // Avoid using public rpcTarget in production.
  // Use services like Infura, Quicknode etc
  displayName: 'Hedera Testnet',
  blockExplorerUrl: 'https://hashscan.io/testnet',
  ticker: 'HBAR',
  tickerName: 'Hedera',
  logo: 'https://scroll.io/static/media/Scroll_FullLogo.f99e4b7ab52f474105da.png',
};

const privateKeyProvider = new EthereumPrivateKeyProvider({
  config: { chainConfig },
});

const web3AuthOptions: Web3AuthOptions = {
  clientId: clientId || '', // Provide default empty string if undefined
  web3AuthNetwork: WEB3AUTH_NETWORK.SAPPHIRE_DEVNET,
  privateKeyProvider,
};
const web3auth = new Web3Auth(web3AuthOptions);

interface ZKProofResponse {
  statusCode: number;
  data: {
    proof: string;
    publicInputs: string[];
  };
  message: string;
}

export default function Home() {
  const router = useRouter();
  const [provider, setProvider] = useState<IProvider | null>(null);
  const [loggedIn, setLoggedIn] = useState(false);
  const [isRobinhoodConnected, setIsRobinhoodConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [holdings, setHoldings] = useState<
    Array<{
      symbol: string;
      noOfShares: number;
      lastHoldingTime: string;
    }>
  >([]);

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      if (sessionStorage.getItem('loggedIn') === 'true') {
        setLoggedIn(true);
        sessionStorage.removeItem('loggedIn');
      }
      try {
        const adapters = await getDefaultExternalAdapters({
          options: web3AuthOptions,
        });
        adapters.forEach((adapter: IAdapter<unknown>) => {
          web3auth.configureAdapter(adapter);
        });
        await web3auth.initModal();
        const web3authProvider = web3auth.provider;
        setProvider(web3authProvider);

        if (web3auth.connected && web3authProvider) {
          setLoggedIn(true);
          await checkRobinhoodConnection(web3authProvider);

          const rhUserId = sessionStorage.getItem('rhUserId');
          if (rhUserId) {
            await createRobinhoodConnection(rhUserId, web3authProvider);
            sessionStorage.removeItem('rhUserId');
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, []);

  const login = async () => {
    const web3authProvider = await web3auth.connect();
    setProvider(web3authProvider);
    if (web3auth.connected) {
      setLoggedIn(true);
    }
  };

  const logout = async () => {
    await web3auth.logout();
    setProvider(null);
    setLoggedIn(false);
    uiConsole('logged out');
  };

  // Redirect to the Robinhood page
  const redirectToRobinhood = () => {
    router.push('/rh/login');
  };

  function uiConsole(...args: unknown[]): void {
    const el = document.querySelector('#console>p');
    if (el) {
      el.innerHTML = JSON.stringify(args || {}, null, 2);
      console.log(...args);
    }
  }

  const fetchHoldings = async (walletAddress: string) => {
    try {
      const response = await fetch('/api/get-holdings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress }),
      });
      const data = await response.json();
      setHoldings(data.holdings);
    } catch (error) {
      console.error('Error fetching holdings:', error);
    }
  };

  const checkRobinhoodConnection = async (currentProvider: IProvider) => {
    try {
      const address = await RPC.getAccounts(currentProvider);
      const response = await fetch('/api/check-robinhood-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ walletAddress: address }),
      });

      const data = await response.json();
      setIsRobinhoodConnected(data.isActive);
      if (data.isActive) {
        await fetchHoldings(address);
      }
    } catch (error) {
      console.error('Error checking Robinhood connection:', error);
    }
  };

  const createRobinhoodConnection = async (
    userId: string,
    currentProvider: IProvider
  ) => {
    try {
      const address = await RPC.getAccounts(currentProvider);
      const response = await fetch('/api/create-robinhood-connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          walletAddress: address,
        }),
      });

      if (response.ok) {
        setIsRobinhoodConnected(true);
      }
    } catch (error) {
      console.error('Error creating Robinhood connection:', error);
    }
  };

  const claimAirdrop = async (holding: {
    symbol: string;
    noOfShares: number;
    lastHoldingTime: string;
  }) => {
    if (!provider) {
      uiConsole('provider not initialized yet');
      return;
    }

    try {
      // Generate ZK Proof
      const host = process.env.BACKEND_URL;
      const response = await fetch(
        'http://' + host + '/api/v1/generateZkProof',
        {
          method: 'POST',
          mode: 'cors',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            address: await RPC.getAccounts(provider),
            stockQuantity: holding.noOfShares.toString(),
            stockBuyTimestamp: holding.lastHoldingTime,
          }),
        }
      );

      const zkProofData: ZKProofResponse = await response.json();

      if (response.ok) {
        // TODO: Replace with your actual contract address and ABI
        const contractAddress = process.env.AIRDROP_CONTRACT_ADDRESS ? process.env.AIRDROP_CONTRACT_ADDRESS : '';
        const contractABI = AIRDROP_CONTRACT_ABI;

        // Make contract call
        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();

        const contract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        // Call the contract method with proof and public inputs
        const tx = await contract.claimAirdrop(
          zkProofData.data.proof,
          zkProofData.data.publicInputs
        );

        await tx.wait();
        uiConsole('Airdrop claimed successfully!');
      }
    } catch (error) {
      console.error('Error claiming airdrop:', error);
      uiConsole('Error claiming airdrop');
    }
  };

  const robinhoodButton = isRobinhoodConnected ? (
    <Button
      className="flex w-[50%] h-[50px] mx-auto mt-[5%] mb-[5%] border-2 border-green-500"
      variant="secondary"
      disabled
    >
      Connected to the Robinhood Trading Account
    </Button>
  ) : (
    <Button
      className="flex w-[50%] h-[50px] mx-auto mt-[5%] mb-[5%]"
      onClick={redirectToRobinhood}
    >
      Connect to the Robinhood Trading Account
    </Button>
  );

  const holdingsTable = (
    <>
      <div className="w-[80%] mx-auto">
        <div className="flex flex-col gap-4">
          <h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
            Your Holdings
          </h2>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Symbol</TableHead>
              <TableHead>No. of Shares</TableHead>
              <TableHead>Last bought on</TableHead>
              <TableHead className="w-[10%]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {holdings.length > 0 ? (
              holdings.map((holding, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {holding.symbol}
                  </TableCell>
                  <TableCell>{holding.noOfShares}</TableCell>
                  <TableCell>
                    {new Date(holding.lastHoldingTime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Button
                      className="bg-green-500"
                      onClick={() => claimAirdrop(holding)}
                    >
                      Avail Airdrop
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                  No holdings found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );

  const loggedInView = (
    <>
      <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6">
        <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}>
          <MountainIcon className="h-6 w-6" />
          <h1 className="ml-2">MeokGlobal</h1>
        </Link>
        <div className="ml-auto flex gap-2">
          <Button onClick={logout}>Log Out</Button>
        </div>
      </header>
      {robinhoodButton}
      {holdingsTable}
    </>
  );

  const unloggedInView = (
    <div className="min-h-screen bg-[url('/background.png')] bg-cover bg-center">
      <header className="flex h-20 w-full shrink-0 items-center px-4 md:px-6 bg-white/80">
        <Link href="#" className="mr-6 hidden lg:flex" prefetch={false}>
          <MountainIcon className="h-6 w-6" />
          <h1 className="ml-2">MeowkGlobal</h1>
        </Link>
        <div className="ml-auto flex gap-2">
          <Button onClick={login}>Login</Button>
        </div>
      </header>
    </div>
  );

  return (
    <div className="container flex flex-col h-screen mx-auto">
      {isLoading ? (
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : (
        <div>{loggedIn ? loggedInView : unloggedInView}</div>
      )}
    </div>
  );
}
