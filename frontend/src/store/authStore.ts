import { storageKeys, tokenKeys } from '@/constants';
import { removeHeader, setHeader } from '@/utils/header';
import { getStorage, removeStorage, setStorage } from '@/utils/storage';
import { StateCreator } from 'zustand';

export interface AuthState {
    isSignedIn: boolean;
    storeSignIn: (token: string | undefined) => void;
    storeSignOut: () => void;
}

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
    isSignedIn: getStorage(storageKeys.IS_SIGNED_IN) ? true : false,
    storeSignIn: (token: string | undefined) => {
        set({ isSignedIn: true });
        setHeader(tokenKeys.AUTHORIZATION, `Bearer ${token}`);
        setStorage(storageKeys.IS_SIGNED_IN, 'true');
    },
    storeSignOut: () => {
        set({ isSignedIn: false });
        removeStorage(storageKeys.IS_SIGNED_IN);
        removeHeader(tokenKeys.AUTHORIZATION);
    },
});
