import { createConfig, http, injected } from "wagmi";
import { baseSepolia } from "wagmi/chains";

import { BASE_SEPOLIA_RPC_URL } from "./contract";

export const wagmiConfig = createConfig({
  chains: [baseSepolia],
  connectors: [injected()],
  transports: {
    [baseSepolia.id]: http(BASE_SEPOLIA_RPC_URL),
  },
  ssr: true,
});
