import { useState, useCallback, useEffect } from "react";
import { usePlaidLink } from "react-plaid-link";
import { useNavigate } from "react-router-dom";
import { plaidApi } from "./api";
import { useAuth } from "./AuthContext";

export default function DashboardPage() {
  const [linkToken, setLinkToken] = useState(null);
  const [connected, setConnected] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [loadingToken, setLoadingToken] = useState(true);

  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Fetch a fresh link_token from our backend as soon as the dashboard loads.
  // Plaid Link needs this token before it can open.
  useEffect(() => {
    plaidApi
      .createLinkToken()
      .then((res) => setLinkToken(res.data.link_token))
      .catch((err) => {
        console.error("Failed to create link token", err);
        setStatusMessage("Couldn't start bank connection. Try refreshing.");
      })
      .finally(() => setLoadingToken(false));
  }, []);

  // Called by Plaid Link once the user finishes connecting a sandbox bank.
  // We get a temporary public_token here that must be exchanged server-side.
  const onSuccess = useCallback((publicToken) => {
    setStatusMessage("Connecting your account...");
    plaidApi
      .exchangeToken(publicToken)
      .then(() => {
        setConnected(true);
        setStatusMessage("Bank account connected successfully!");
      })
      .catch((err) => {
        console.error("Failed to exchange token", err);
        setStatusMessage("Something went wrong connecting your bank.");
      });
  }, []);

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess,
  });

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1 style={styles.logo}>Expense Tracker</h1>
        <div style={styles.headerRight}>
          <span style={styles.userName}>{user?.fullName}</span>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Log out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {!connected ? (
          <div style={styles.connectCard}>
            <h2 style={styles.connectTitle}>Connect your bank account</h2>
            <p style={styles.connectSubtitle}>
              Securely link a bank account to start tracking your expenses
              automatically. This uses Plaid's sandbox environment for
              testing.
            </p>
            <button
              onClick={() => open()}
              disabled={!ready || loadingToken}
              style={styles.connectButton}
            >
              {loadingToken ? "Loading..." : "Connect a bank account"}
            </button>
            {statusMessage && <p style={styles.status}>{statusMessage}</p>}
          </div>
        ) : (
          <div style={styles.connectCard}>
            <h2 style={styles.connectTitle}>✅ Bank account connected</h2>
            <p style={styles.connectSubtitle}>{statusMessage}</p>
            <p style={styles.nextStep}>
              Transaction syncing and the spending dashboard are next.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    backgroundColor: "#f5f5f7",
    fontFamily: "system-ui, sans-serif",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 2rem",
    backgroundColor: "white",
    borderBottom: "1px solid #eee",
  },
  logo: {
    fontSize: "1.25rem",
    fontWeight: 700,
    margin: 0,
  },
  headerRight: {
    display: "flex",
    alignItems: "center",
    gap: "1rem",
  },
  userName: {
    color: "#444",
    fontSize: "0.9rem",
  },
  logoutButton: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid #ddd",
    backgroundColor: "white",
    cursor: "pointer",
    fontSize: "0.85rem",
  },
  main: {
    display: "flex",
    justifyContent: "center",
    paddingTop: "4rem",
    padding: "4rem 1rem",
  },
  connectCard: {
    backgroundColor: "white",
    padding: "2.5rem",
    borderRadius: "12px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    maxWidth: "440px",
    width: "100%",
    textAlign: "center",
  },
  connectTitle: {
    fontSize: "1.25rem",
    fontWeight: 700,
    marginBottom: "0.5rem",
  },
  connectSubtitle: {
    color: "#666",
    fontSize: "0.9rem",
    lineHeight: 1.5,
    marginBottom: "1.5rem",
  },
  connectButton: {
    padding: "0.85rem 1.5rem",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#2563eb",
    color: "white",
    fontWeight: 600,
    fontSize: "1rem",
    cursor: "pointer",
  },
  status: {
    marginTop: "1rem",
    fontSize: "0.85rem",
    color: "#444",
  },
  nextStep: {
    fontSize: "0.85rem",
    color: "#999",
    fontStyle: "italic",
  },
};
