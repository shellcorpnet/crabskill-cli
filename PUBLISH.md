# Publishing to npm

Step-by-step guide to publish the `crabskill` package to npm.

## Prerequisites

1. An npm account — [Sign up at npmjs.com](https://www.npmjs.com/signup)
2. Node.js and npm installed

## Steps

### 1. Create npm Account (if needed)

```bash
npm adduser
```

Or sign up at https://www.npmjs.com/signup

### 2. Login to npm

```bash
npm login
```

Enter your username, password, and email when prompted.

Verify you're logged in:
```bash
npm whoami
```

### 3. Check Package Name Availability

```bash
npm view crabskill
```

If you see "404 Not Found", the name is available! ✅

If the name is taken, options:
- Use a scoped name: `@shellcorp/crabskill`
- Choose a different name

### 4. Test Locally First

```bash
cd /Users/vlad/code/crabskill-cli

# Install dependencies
npm install

# Test the CLI
node bin/crabskill.js --version
node bin/crabskill.js --help
node bin/crabskill.js search
```

### 5. Publish!

```bash
npm publish
```

For a scoped package that should be public:
```bash
npm publish --access public
```

### 6. Verify Publication

```bash
# Check it exists on npm
npm view crabskill

# Test installation
npx crabskill --version
```

### 7. Test npx

```bash
# In a different directory
npx crabskill --version
npx crabskill search
```

## Updating the Package

1. Update version in `package.json`:
   ```json
   "version": "1.0.1"
   ```

2. Or use npm version command:
   ```bash
   npm version patch  # 1.0.0 -> 1.0.1
   npm version minor  # 1.0.0 -> 1.1.0
   npm version major  # 1.0.0 -> 2.0.0
   ```

3. Publish:
   ```bash
   npm publish
   ```

## If `crabskill` Is Taken

Update `package.json`:
```json
{
  "name": "@shellcorp/crabskill",
  "bin": {
    "crabskill": "./bin/crabskill.js"
  }
}
```

Then publish with:
```bash
npm publish --access public
```

Users would install with:
```bash
npx @shellcorp/crabskill install <name>
npm install -g @shellcorp/crabskill
```

## Troubleshooting

### "You do not have permission to publish"
- Check you're logged in: `npm whoami`
- Check the package name isn't taken by someone else

### "Package name too similar to existing"
- npm prevents confusingly similar names
- Try a scoped package: `@shellcorp/crabskill`

### "Must be logged in to publish"
```bash
npm login
```

### Test Before Publishing
```bash
npm pack
```
This creates a `.tgz` file you can inspect to see exactly what will be published.

## Quick Commands Reference

```bash
# Login
npm login

# Check who you're logged in as
npm whoami

# See what will be published
npm pack --dry-run

# Publish
npm publish

# Publish scoped package publicly
npm publish --access public

# Unpublish (within 72 hours only)
npm unpublish crabskill@1.0.0

# Deprecate a version
npm deprecate crabskill@1.0.0 "Use 1.0.1 instead"

# View package info
npm view crabskill
```

## After Publishing

1. Test `npx crabskill --version` works
2. Update the CrabSkill homepage to feature the npm install method
3. Update documentation
4. Announce the release! 🦀
