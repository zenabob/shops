const fs = require("fs");
const path = require("path");
const axios = require("axios");

// ✅ Add "type" to control file format
const apps = [
  { name: "shops_app_sellers", path: "../shops_app_sellers/ngrok-url.js", suffix: "shops_app_sellers", type: "frontend" },
  { name: "shops_app_buyers", path: "../shops_app_buyers/ngrok-url.js", suffix: "shops_app_buyers", type: "frontend" },
  { name: "shops_app_Admin", path: "../shops_app_Admin/ngrok-url.js", suffix: "shops_app_Admin", type: "frontend" },
  { name: "shops_app_buyers_backend", path: "../shops_app_buyers/Backend/ngrok-url.js", suffix: "shops_app_sellers", type: "backend" },
];

const possiblePorts = [4041, 4040];

async function getNgrokTunnelUrl() {
  for (const port of possiblePorts) {
    try {
      const res = await axios.get(`http://127.0.0.1:${port}/api/tunnels`);
      const httpsTunnel = res.data.tunnels.find(
        (tunnel) => tunnel.proto === "https" && tunnel.public_url.includes("ngrok")
      );
      if (httpsTunnel) return httpsTunnel.public_url;
    } catch (err) {
      console.warn(`⚠️ Failed to connect to ngrok on port ${port}: ${err.message}`);
    }
  }
  return null;
}

async function updateNgrokUrls() {
  const ngrokUrl = await getNgrokTunnelUrl();

  if (!ngrokUrl) {
    console.error("❌ No valid ngrok HTTPS tunnel found on any port.");
    return;
  }

  apps.forEach(({ path: configPath, suffix, type }) => {
    const fullPath = path.resolve(__dirname, configPath);

    let content;
    if (type === "frontend") {
      content = `// Auto-generated ngrok config for ${suffix}
export const NGROK_URL = "${ngrokUrl}";
export const API_BASE_URL = \`\${NGROK_URL}/${suffix}\`;
`;
    } else if (type === "backend") {
      content = `
module.exports = {
  NGROK_URL: "${ngrokUrl}",
};
`;
    }

    fs.writeFileSync(fullPath, content, "utf-8");
    console.log(`✅ Updated ${suffix} config at ${configPath}`);
  });
}

updateNgrokUrls();
