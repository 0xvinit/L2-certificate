declare module '@account-kit/react' {
  // Minimal typings to satisfy the compiler where actual package types are not present
  export function useSendCalls(_: any): { sendCallsAsync: (args: any) => Promise<any> };
}


