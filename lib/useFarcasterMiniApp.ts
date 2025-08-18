import { useState, useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

export interface FarcasterMiniAppState {
  isInMiniApp: boolean;
  isLoading: boolean;
  user: {
    fid: number;
    username?: string;
    displayName?: string;
    pfpUrl?: string;
  } | null;
  client: {
    platformType?: 'web' | 'mobile';
    clientFid: number;
    added: boolean;
  } | null;
}

export function useFarcasterMiniApp() {
  const [state, setState] = useState<FarcasterMiniAppState>({
    isInMiniApp: false,
    isLoading: true,
    user: null,
    client: null,
  });

  useEffect(() => {
    const checkMiniApp = async () => {
      try {
        const miniAppStatus = await sdk.isInMiniApp();
        
        if (miniAppStatus) {
          // We're in a Mini App environment
          await sdk.actions.ready();
          
          // Get context information
          const context = await sdk.context;
          
          setState({
            isInMiniApp: true,
            isLoading: false,
            user: context.user || null,
            client: context.client || null,
          });
        } else {
          // Not in a Mini App environment
          setState({
            isInMiniApp: false,
            isLoading: false,
            user: null,
            client: null,
          });
        }
      } catch (error) {
        console.log('Not in Mini App environment:', error);
        setState({
          isInMiniApp: false,
          isLoading: false,
          user: null,
          client: null,
        });
      }
    };

    checkMiniApp();
  }, []);

  const getEthereumProvider = () => {
    if (!state.isInMiniApp) return null;
    return sdk.wallet.getEthereumProvider();
  };

  const getSolanaProvider = () => {
    if (!state.isInMiniApp) return null;
    return sdk.wallet.getSolanaProvider();
  };

  return {
    ...state,
    getEthereumProvider,
    getSolanaProvider,
    sdk: state.isInMiniApp ? sdk : null,
  };
}
