async function loginWithMetaMask() {
  if (typeof window.ethereum !== "undefined") {
    try {
      // Request account access
      const accounts = await window.ethereum.request({
        method: "eth_accounts",
      });
      const username = document.getElementById("username").value;
      const location = document.getElementById("location").value;
      console.log(username, location);
      if (accounts.length === 0) {
        alert("No accounts found. Please connect with MetaMask.");
        return;
      }

      const address = accounts[0];
      const message = `Login to My App`;

      // Sign the message
      const signature = await window.ethereum.request({
        method: "personal_sign",
        params: [message, address],
      });

      // Send signature and address to your server for verification
      fetch("/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          address: address,
          signature: signature,
          username: username,
          location: location,
        }),
      }).then((response) => {
        if (response.ok) {
          window.location.href = "/home";
        } else {
          alert("Login failed");
        }
      });
    } catch (error) {
      console.error(error);
      alert("An error occurred. Please try again.");
    }
  } else {
    alert("MetaMask not detected");
  }
}
