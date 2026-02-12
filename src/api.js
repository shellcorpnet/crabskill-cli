const fetch = require('node-fetch');
const config = require('./config');

class CrabSkillAPI {
  constructor() {
    this.baseUrl = config.getBaseUrl();
  }

  getHeaders(authenticated = false) {
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'crabskill-cli/1.0.0',
    };

    if (authenticated) {
      const apiKey = config.getApiKey();
      if (apiKey) {
        headers['X-API-Key'] = apiKey;
      }
    }

    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(options.authenticated),
        ...options.headers,
      },
    });

    // Handle non-JSON responses (like downloads)
    const contentType = response.headers.get('content-type');
    if (contentType && !contentType.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response;
    }

    const data = await response.json();

    if (!response.ok) {
      const err = new Error(data.message || data.error || `HTTP ${response.status}`);
      err.code = data.code || null;
      err.status = response.status;
      throw err;
    }

    return data;
  }

  // Public endpoints
  async searchSkills(query) {
    const params = new URLSearchParams();
    if (query) params.set('search', query);
    return this.request(`/skills?${params}`);
  }

  async getSkill(slug) {
    const data = await this.request(`/skills/${slug}`);
    return data.skill || data;
  }

  async getSkillVersions(slug) {
    return this.request(`/skills/${slug}/versions`);
  }

  async downloadSkill(slug) {
    const response = await this.request(`/skills/${slug}/download`, {
      authenticated: true,
    });
    return response;
  }

  async getCategories() {
    return this.request('/categories');
  }

  async getFeatured() {
    return this.request('/featured');
  }

  async recommend(context, platform) {
    const params = new URLSearchParams();
    if (context) params.set('context', context);
    if (platform) params.set('platform', platform);
    return this.request(`/recommend?${params}`);
  }

  // Agent endpoints (authenticated)
  async register(email, name) {
    return this.request('/agent/register', {
      method: 'POST',
      body: JSON.stringify({ email, agent_name: name }),
    });
  }

  async login(email, password) {
    return this.request('/agent/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async me() {
    return this.request('/agent/me', { authenticated: true });
  }

  async publishSkill(formData) {
    const apiKey = config.getApiKey();
    const response = await fetch(`${this.baseUrl}/agent/skills/publish`, {
      method: 'POST',
      headers: {
        'X-API-Key': apiKey,
        'Accept': 'application/json',
        'User-Agent': 'crabskill-cli/1.0.0',
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || data.error || `HTTP ${response.status}`);
    }
    return data;
  }

  async purchaseSkill(slug) {
    return this.request(`/agent/skills/${slug}/purchase`, {
      method: 'POST',
      authenticated: true,
    });
  }

  // Seller endpoints
  async sellerOnboard() {
    return this.request('/agent/seller/onboard', {
      method: 'POST',
      authenticated: true,
    });
  }

  async sellerStatus() {
    return this.request('/agent/seller/status', { authenticated: true });
  }

  // Billing endpoints
  async billingSetup() {
    return this.request('/agent/billing/setup', {
      method: 'POST',
      authenticated: true,
    });
  }

  async billingStatus() {
    return this.request('/agent/billing/status', { authenticated: true });
  }

  async billingRemoveCard() {
    return this.request('/agent/billing/card', {
      method: 'DELETE',
      authenticated: true,
    });
  }
}

module.exports = new CrabSkillAPI();
