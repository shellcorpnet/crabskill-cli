const { program } = require('commander');
const chalk = require('chalk');
const ora = require('ora');
const prompts = require('prompts');
const path = require('path');
const pkg = require('../package.json');
const api = require('./api');
const config = require('./config');
const installer = require('./installer');
const publisher = require('./publisher');
const utils = require('./utils');

const BANNER = chalk.red(`
 🦀 CrabSkill CLI v${pkg.version}
`);

// Helper to require authentication
function requireAuth() {
  if (!config.isAuthenticated()) {
    console.log(chalk.yellow('\n⚠️  You need to be logged in to do this.'));
    console.log(chalk.dim('Run: ') + chalk.cyan('crabskill login') + chalk.dim(' or ') + chalk.cyan('crabskill register'));
    process.exit(1);
  }
}

// Setup program
program
  .name('crabskill')
  .description('🦀 CLI for the CrabSkill agent skill marketplace')
  .version(pkg.version);

// ═══════════════════════════════════════════════════════════════════════════════
// INSTALL
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('install <slug>')
  .alias('i')
  .description('Install a skill from CrabSkill')
  .option('-f, --force', 'Overwrite if already installed')
  .action(async (slug, options) => {
    const spinner = ora(`Fetching ${chalk.cyan(slug)}...`).start();
    
    try {
      // Get skill info first
      const skill = await api.getSkill(slug);
      spinner.text = `Downloading ${chalk.cyan(skill.name)}...`;
      
      // Check if paid skill and needs purchase
      if (skill.pricing_type === 'paid' && skill.price_cents > 0 && !skill.purchased) {
        spinner.stop();
        console.log(chalk.yellow(`\n💰 This skill requires purchase: ${utils.formatPrice(skill.pricing_type, skill.price_cents)}`));
        
        if (config.isAuthenticated()) {
          const { confirm } = await prompts({
            type: 'confirm',
            name: 'confirm',
            message: 'Would you like to purchase it now?',
            initial: false,
          });
          
          if (confirm) {
            const purchaseSpinner = ora('Processing purchase...').start();
            try {
              const result = await api.purchaseSkill(slug);
              if (result.payment_url) {
                purchaseSpinner.stop();
                console.log(chalk.yellow('\n🔗 Complete payment in your browser:'));
                console.log(chalk.cyan(result.payment_url));
                await utils.openBrowser(result.payment_url);
                console.log(chalk.dim('\nRun this command again after payment completes.'));
                return;
              }
            } catch (err) {
              purchaseSpinner.fail(`Purchase failed: ${err.message}`);
              return;
            }
          }
        } else {
          console.log(chalk.dim('Login with ') + chalk.cyan('crabskill login') + chalk.dim(' to purchase.'));
        }
        return;
      }
      
      // Download and install
      const result = await installer.downloadAndExtract(slug, { force: options.force });
      
      spinner.succeed(`Installed ${chalk.cyan(skill.name)} ${chalk.dim(`v${skill.current_version}`)}`);
      console.log(chalk.dim(`   → ${result.path}`));
      
      if (skill.tagline) {
        console.log(chalk.dim(`   ${skill.tagline}`));
      }
      
    } catch (err) {
      spinner.fail(`Failed to install: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// SEARCH
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('search [query]')
  .alias('s')
  .description('Search for skills')
  .option('-c, --category <slug>', 'Filter by category')
  .action(async (query, options) => {
    const spinner = ora('Searching...').start();
    
    try {
      const results = await api.searchSkills(query);
      spinner.stop();
      
      if (!results.data || results.data.length === 0) {
        console.log(chalk.yellow('\nNo skills found.'));
        return;
      }
      
      console.log(chalk.bold(`\n🦀 Found ${results.data.length} skill${results.data.length === 1 ? '' : 's'}:\n`));
      
      for (const skill of results.data) {
        const installed = utils.isSkillInstalled(skill.slug) ? chalk.green(' ✓') : '';
        const price = utils.formatPrice(skill.pricing_type, skill.price_cents);
        const priceColor = skill.pricing_type === 'free' ? chalk.green : chalk.yellow;
        
        console.log(
          chalk.cyan.bold(skill.name) + installed +
          chalk.dim(` (${skill.slug})`) +
          '  ' + priceColor(price)
        );
        
        if (skill.tagline) {
          console.log(chalk.dim(`   ${skill.tagline}`));
        }
        
        console.log(
          chalk.dim('   ') +
          chalk.dim(`↓ ${utils.formatNumber(skill.downloads_count)}`) +
          chalk.dim('  ') +
          chalk.yellow(utils.formatRating(skill.rating_avg))
        );
        console.log();
      }
      
      console.log(chalk.dim(`Install with: npx crabskill install <slug>\n`));
      
    } catch (err) {
      spinner.fail(`Search failed: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// LIST
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('list')
  .alias('ls')
  .description('List installed skills')
  .option('-u, --check-updates', 'Check for available updates')
  .action(async (options) => {
    const installed = utils.listInstalledSkills();
    
    if (installed.length === 0) {
      console.log(chalk.yellow('\nNo skills installed.'));
      console.log(chalk.dim('Install one with: npx crabskill install <slug>\n'));
      return;
    }
    
    console.log(chalk.bold(`\n🦀 Installed skills (${installed.length}):\n`));
    
    for (const skill of installed) {
      let updateInfo = '';
      
      if (options.checkUpdates) {
        try {
          const remote = await api.getSkill(skill.slug);
          if (remote.current_version && skill.version !== remote.current_version) {
            updateInfo = chalk.yellow(` → ${remote.current_version} available`);
          }
        } catch {
          // Skill might not exist remotely (local only)
        }
      }
      
      console.log(
        chalk.cyan.bold(skill.slug) +
        chalk.dim(` v${skill.version || 'unknown'}`) +
        updateInfo
      );
      console.log(chalk.dim(`   ${skill.path}`));
      console.log();
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// UPDATE
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('update [slug]')
  .alias('up')
  .description('Update a skill or all skills')
  .action(async (slug) => {
    const toUpdate = slug 
      ? [{ slug, version: utils.getInstalledSkillVersion(slug) }]
      : utils.listInstalledSkills();
    
    if (toUpdate.length === 0) {
      console.log(chalk.yellow('\nNo skills to update.'));
      return;
    }
    
    console.log(chalk.bold(`\n🦀 Checking for updates...\n`));
    
    let updated = 0;
    for (const skill of toUpdate) {
      const spinner = ora(`Checking ${chalk.cyan(skill.slug)}...`).start();
      
      try {
        const remote = await api.getSkill(skill.slug);
        
        if (!remote.current_version || skill.version === remote.current_version) {
          spinner.info(`${chalk.cyan(skill.slug)} is up to date`);
          continue;
        }
        
        spinner.text = `Updating ${chalk.cyan(skill.slug)} to v${remote.current_version}...`;
        await installer.downloadAndExtract(skill.slug, { force: true });
        spinner.succeed(`Updated ${chalk.cyan(skill.slug)} to v${remote.current_version}`);
        updated++;
        
      } catch (err) {
        spinner.warn(`Could not update ${skill.slug}: ${err.message}`);
      }
    }
    
    console.log(chalk.dim(`\n${updated} skill${updated === 1 ? '' : 's'} updated.\n`));
  });

// ═══════════════════════════════════════════════════════════════════════════════
// UNINSTALL
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('uninstall <slug>')
  .alias('rm')
  .description('Uninstall a skill')
  .action(async (slug) => {
    const spinner = ora(`Uninstalling ${chalk.cyan(slug)}...`).start();
    
    try {
      const result = await installer.uninstallSkill(slug);
      spinner.succeed(`Uninstalled ${chalk.cyan(slug)}`);
      console.log(chalk.dim(`   Removed: ${result.path}`));
    } catch (err) {
      spinner.fail(`Failed to uninstall: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('info <slug>')
  .description('Show detailed skill information')
  .action(async (slug) => {
    const spinner = ora(`Fetching info for ${chalk.cyan(slug)}...`).start();
    
    try {
      const skill = await api.getSkill(slug);
      spinner.stop();
      
      const installed = utils.isSkillInstalled(slug);
      const installedVersion = installed ? utils.getInstalledSkillVersion(slug) : null;
      
      console.log();
      console.log(chalk.cyan.bold(`🦀 ${skill.name}`) + chalk.dim(` (${skill.slug})`));
      if (skill.tagline) {
        console.log(chalk.dim(skill.tagline));
      }
      console.log();
      
      console.log(chalk.dim('Version:     ') + skill.current_version);
      console.log(chalk.dim('Price:       ') + utils.formatPrice(skill.pricing_type, skill.price_cents));
      console.log(chalk.dim('Downloads:   ') + utils.formatNumber(skill.downloads_count));
      console.log(chalk.dim('Rating:      ') + utils.formatRating(skill.rating_avg));
      if (skill.author) {
        console.log(chalk.dim('Author:      ') + skill.author.name);
      }
      if (skill.category) {
        console.log(chalk.dim('Category:    ') + skill.category.name);
      }
      console.log(chalk.dim('Installed:   ') + (installed ? chalk.green(`Yes (v${installedVersion})`) : chalk.dim('No')));
      
      if (installed && installedVersion !== skill.current_version) {
        console.log(chalk.yellow(`\n⚡ Update available: v${installedVersion} → v${skill.current_version}`));
        console.log(chalk.dim(`   Run: crabskill update ${slug}`));
      }
      
      console.log(chalk.dim('\n─────────────────────────────────────────'));
      console.log(chalk.dim(`URL: https://crabskill.com/skills/${slug}`));
      console.log();
      
    } catch (err) {
      spinner.fail(`Failed to get info: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// LOGIN
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('login')
  .description('Login with your API key')
  .action(async () => {
    console.log(BANNER);
    
    const { apiKey } = await prompts({
      type: 'password',
      name: 'apiKey',
      message: 'Enter your API key:',
      validate: v => v.length > 0 || 'API key is required',
    });
    
    if (!apiKey) {
      console.log(chalk.dim('Cancelled.'));
      return;
    }
    
    // Save temporarily to test
    config.setApiKey(apiKey);
    
    const spinner = ora('Verifying...').start();
    
    try {
      const user = await api.me();
      spinner.succeed(`Logged in as ${chalk.cyan(user.name || user.email)}`);
      console.log(chalk.dim(`\nConfig saved to: ${config.CONFIG_FILE}`));
    } catch (err) {
      config.setApiKey(null);
      spinner.fail(`Invalid API key: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// REGISTER
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('register')
  .description('Register a new account')
  .action(async () => {
    console.log(BANNER);
    
    const response = await prompts([
      {
        type: 'text',
        name: 'email',
        message: 'Email address:',
        validate: v => v.includes('@') || 'Enter a valid email',
      },
      {
        type: 'text',
        name: 'name',
        message: 'Your name (optional):',
      },
    ]);
    
    if (!response.email) {
      console.log(chalk.dim('Cancelled.'));
      return;
    }
    
    const spinner = ora('Registering...').start();
    
    try {
      const result = await api.register(response.email, response.name);
      spinner.succeed('Registration successful!');
      
      if (result.api_key) {
        config.setApiKey(result.api_key);
        console.log(chalk.green('\n✓ API key saved automatically'));
        console.log(chalk.dim(`  Config: ${config.CONFIG_FILE}`));
      } else {
        console.log(chalk.yellow('\n📧 Check your email for your API key'));
        console.log(chalk.dim('Then run: crabskill login'));
      }
    } catch (err) {
      spinner.fail(`Registration failed: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLISH
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('publish [directory]')
  .description('Publish a skill to CrabSkill')
  .action(async (directory = '.') => {
    requireAuth();
    
    console.log(BANNER);
    const absDir = path.resolve(directory);
    console.log(chalk.dim(`Publishing from: ${absDir}\n`));
    
    const spinner = ora('Packaging skill...').start();
    
    try {
      spinner.text = 'Validating and packaging...';
      const result = await publisher.publishSkill(directory);
      
      spinner.succeed('Skill published successfully!');
      
      if (result.skill) {
        console.log();
        console.log(chalk.cyan.bold(`🦀 ${result.skill.name}`));
        console.log(chalk.dim(`   Slug: ${result.skill.slug}`));
        console.log(chalk.dim(`   Version: ${result.skill.current_version}`));
        console.log(chalk.dim(`   Status: ${result.skill.status}`));
        
        if (result.skill.status === 'pending') {
          console.log(chalk.yellow('\n⏳ Your skill is pending review.'));
          console.log(chalk.dim('   You\'ll be notified when it\'s approved.'));
        }
        
        console.log(chalk.dim(`\n   URL: https://crabskill.com/skills/${result.skill.slug}`));
      }
      
      if (result.audit) {
        console.log(chalk.bold('\n📋 Audit Results:'));
        console.log(chalk.dim(`   Score: ${result.audit.score}/100`));
        if (result.audit.issues && result.audit.issues.length > 0) {
          console.log(chalk.yellow('   Issues:'));
          for (const issue of result.audit.issues) {
            console.log(chalk.dim(`   - ${issue}`));
          }
        }
      }
      
    } catch (err) {
      spinner.fail(`Publish failed: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BILLING
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('billing [action]')
  .description('Manage billing (use "billing setup" to add payment method)')
  .action(async (action) => {
    requireAuth();
    
    if (action === 'setup') {
      const spinner = ora('Getting billing setup link...').start();
      
      try {
        const result = await api.billingSetup();
        spinner.stop();
        
        if (result.url) {
          console.log(chalk.cyan('\n🔗 Opening billing setup in your browser...\n'));
          console.log(chalk.dim(result.url));
          await utils.openBrowser(result.url);
        } else {
          console.log(chalk.green('\n✓ Billing is already set up!'));
        }
      } catch (err) {
        spinner.fail(`Failed: ${err.message}`);
        process.exit(1);
      }
      return;
    }
    
    // Default: show status
    const spinner = ora('Fetching billing status...').start();
    
    try {
      const status = await api.billingStatus();
      spinner.stop();
      
      console.log(chalk.bold('\n🦀 Billing Status\n'));
      
      if (status.has_payment_method) {
        console.log(chalk.green('✓ Payment method on file'));
        if (status.card_brand && status.card_last4) {
          console.log(chalk.dim(`  ${status.card_brand} •••• ${status.card_last4}`));
        }
      } else {
        console.log(chalk.yellow('✗ No payment method'));
        console.log(chalk.dim('  Run: crabskill billing setup'));
      }
      
      if (status.balance_cents !== undefined) {
        console.log(chalk.dim(`\nBalance: $${(status.balance_cents / 100).toFixed(2)}`));
      }
      
      console.log();
      
    } catch (err) {
      spinner.fail(`Failed to get billing status: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// SELLER
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('seller [action]')
  .description('Seller management (use "seller setup" to become a seller)')
  .action(async (action) => {
    requireAuth();
    
    if (action === 'setup') {
      const spinner = ora('Starting seller onboarding...').start();
      
      try {
        const result = await api.sellerOnboard();
        spinner.stop();
        
        if (result.url) {
          console.log(chalk.cyan('\n🔗 Opening Stripe Connect onboarding...\n'));
          console.log(chalk.dim(result.url));
          await utils.openBrowser(result.url);
          console.log(chalk.dim('\nComplete the onboarding to start selling skills.'));
        } else if (result.status === 'active') {
          console.log(chalk.green('\n✓ You\'re already set up as a seller!'));
        }
      } catch (err) {
        spinner.fail(`Failed: ${err.message}`);
        process.exit(1);
      }
      return;
    }
    
    if (action === 'status' || !action) {
      const spinner = ora('Fetching seller status...').start();
      
      try {
        const status = await api.sellerStatus();
        spinner.stop();
        
        console.log(chalk.bold('\n🦀 Seller Status\n'));
        
        const statusEmoji = {
          active: '✓',
          pending: '⏳',
          none: '✗',
        };
        
        const statusColor = {
          active: chalk.green,
          pending: chalk.yellow,
          none: chalk.dim,
        };
        
        const s = status.status || 'none';
        console.log(statusColor[s](`${statusEmoji[s]} ${s.charAt(0).toUpperCase() + s.slice(1)}`));
        
        if (s === 'none') {
          console.log(chalk.dim('\nBecome a seller: crabskill seller setup'));
        } else if (s === 'active') {
          if (status.earnings_cents !== undefined) {
            console.log(chalk.dim(`\nTotal earnings: $${(status.earnings_cents / 100).toFixed(2)}`));
          }
          if (status.skills_count !== undefined) {
            console.log(chalk.dim(`Published skills: ${status.skills_count}`));
          }
        }
        
        console.log();
        
      } catch (err) {
        spinner.fail(`Failed to get seller status: ${err.message}`);
        process.exit(1);
      }
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// WHOAMI
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('whoami')
  .description('Show current logged-in user')
  .action(async () => {
    if (!config.isAuthenticated()) {
      console.log(chalk.dim('\nNot logged in.'));
      console.log(chalk.dim('Run: crabskill login'));
      return;
    }
    
    const spinner = ora('Fetching profile...').start();
    
    try {
      const user = await api.me();
      spinner.stop();
      
      console.log();
      console.log(chalk.cyan.bold(`🦀 ${user.name || 'Anonymous'}`));
      console.log(chalk.dim(`   ${user.email}`));
      if (user.username) {
        console.log(chalk.dim(`   @${user.username}`));
      }
      console.log();
      
    } catch (err) {
      spinner.fail(`Failed: ${err.message}`);
      process.exit(1);
    }
  });

// ═══════════════════════════════════════════════════════════════════════════════
// LOGOUT
// ═══════════════════════════════════════════════════════════════════════════════
program
  .command('logout')
  .description('Remove saved credentials')
  .action(() => {
    config.setApiKey(null);
    console.log(chalk.green('\n✓ Logged out successfully.\n'));
  });

// Parse and run
program.parse();
