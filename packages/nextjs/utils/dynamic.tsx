import { DynamicContextProvider } from "@dynamic-labs/sdk-react-core";

const Dynamic = ({ children }: { children: JSX.Element }) => {
    
    return (
      <DynamicContextProvider
        settings={{
          environmentId: process.env.DYNAMIC || "",
        }}
      >
        {children}
      </DynamicContextProvider>
    );
}

export default Dynamic;