"use client";
import { config, queryClient } from "../../config";
import {
  // @ts-ignore
  AlchemyAccountProvider,
  // @ts-ignore
  AlchemyAccountsProviderProps,
} from "@account-kit/react";
import { QueryClientProvider } from "@tanstack/react-query";
import { PropsWithChildren } from "react";

export const Providers = (
  props: PropsWithChildren<{
    initialState?: AlchemyAccountsProviderProps["initialState"];
  }>,
) => {
    console.log(config, queryClient, props.initialState);
  return (
    <QueryClientProvider client={queryClient}>
      <AlchemyAccountProvider
        config={config}
        queryClient={queryClient}
        initialState={props.initialState}
      >
        {props.children}
      </AlchemyAccountProvider>
    </QueryClientProvider>
  );
};
