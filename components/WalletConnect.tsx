"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';

function truncate(addr: string): string {
	return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

export default function WalletConnect() {
	const [account, setAccount] = useState<string | null>(null);

	useEffect(() => {
		const saved = window.localStorage.getItem('gridgit:account');
		if (saved && /^0x[0-9a-fA-F]{40}$/.test(saved)) setAccount(saved);
		const eth = (window as any).ethereum;
		if (!eth) return;
		const handler = (accounts: string[]) => {
			const addr = accounts?.[0]?.toLowerCase() || null;
			setAccount(addr);
			if (addr) window.localStorage.setItem('gridgit:account', addr);
			else window.localStorage.removeItem('gridgit:account');
		};
		eth.request?.({ method: 'eth_accounts' }).then((accts: string[]) => handler(accts)).catch(()=>{});
		eth.on?.('accountsChanged', handler);
		return () => { eth?.removeListener?.('accountsChanged', handler); };
	}, []);

	async function connect() {
		const eth = (window as any).ethereum;
		if (!eth) return alert('Install MetaMask');
		const accts = await eth.request({ method: 'eth_requestAccounts' });
		const addr = (accts?.[0] as string | undefined)?.toLowerCase() || null;
		setAccount(addr);
		if (addr) window.localStorage.setItem('gridgit:account', addr);
	}

	function disconnect() {
		setAccount(null);
		window.localStorage.removeItem('gridgit:account');
	}

	return (
		<div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
			{account ? (
				<>
					<Link href={`/gallery/${account}`} className="nav-link">My Gallery</Link>
					<div style={{ display: 'flex', gap: 6 }}>
						<button className="button" onClick={connect}>{truncate(account)}</button>
						<button className="button" onClick={disconnect}>Disconnect</button>
					</div>
				</>
			) : (
				<button className="button" onClick={connect}>Connect Wallet</button>
			)}
		</div>
	);
}


