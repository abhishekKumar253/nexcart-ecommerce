import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignUpButton,
  UserButton,
  useAuth,
} from "@clerk/clerk-react";
import PageLoader from "./components/PageLoader";
import Layout from "./components/Layout";

function App() {
  const { isLoaded } = useAuth();

  if (!isLoaded) {
    return <PageLoader />;
  }

  return (
    <Layout>
      <header>
        <SignedOut>
          <SignInButton mode="modal" />
          <SignUpButton mode="modal" />
        </SignedOut>

        <SignedIn>
          <UserButton />
        </SignedIn>
      </header>

      <p className="text-red-500">Welcome to the App!</p>
      <button className="bg-blue-500 text-white px-4 py-2 rounded">
        Click me
      </button>
    </Layout>
  );
}

export default App;
