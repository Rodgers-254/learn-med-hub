// src/components/GetBookUrl.tsx
import React, { useState } from "react";
import { useAuth } from "@/lib/AuthContext";

interface GetBookUrlProps {
  bookId: string;
}

const GetBookUrl: React.FC<GetBookUrlProps> = ({ bookId }) => {
  const { session } = useAuth();
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function fetchBookUrl() {
    if (!session) {
      setError("You must be logged in to access this book.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/functions/v1/get-book-url`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,  // Use JWT token from session
        },
        body: JSON.stringify({ book_id: bookId }),
      });

      if (!res.ok) {
        throw new Error(`Error fetching book URL: ${res.statusText}`);
      }

      const data = await res.json();

      if (data.signed_url) {
        setSignedUrl(data.signed_url);
      } else {
        setError("No signed URL returned from server.");
      }
    } catch (err: any) {
      setError(err.message || "Unknown error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={fetchBookUrl} disabled={loading}>
        {loading ? "Loading..." : "Get Book URL"}
      </button>

      {signedUrl && (
        <div>
          <p>Signed URL:</p>
          <a href={signedUrl} target="_blank" rel="noopener noreferrer">
            Open Book
          </a>
        </div>
      )}

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default GetBookUrl;
