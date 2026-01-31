# Auto-Push Scripts for PROJECT KALI - ITVMS

This directory contains scripts for automatically committing and pushing changes to GitHub.

## 📁 Files

- `auto-push.js` - Main auto-push script
- `watch-and-push.js` - File watcher for automatic commits
- `README.md` - This documentation

## 🚀 Usage

### Basic Auto-Push
```bash
# Full auto-push process (add, commit, push)
npm run auto-push

# Or directly
node scripts/auto-push.js
```

### Individual Operations
```bash
# Check git status only
npm run commit status

# Commit changes only
npm run commit

# Push existing commits only
npm run push
```

### File Watcher (Real-time Auto-Push)
```bash
# Start watching for file changes
npm run watch-push

# Or directly
node scripts/watch-and-push.js
```

## ⚙️ Configuration

### Auto-Push Script Options
```bash
# Show help
node scripts/auto-push.js help

# Check status only
node scripts/auto-push.js status

# Commit without pushing
node scripts/auto-push.js commit

# Push existing commits
node scripts/auto-push.js push
```

### File Watcher Options
```bash
# Show help
node scripts/watch-and-push.js help

# Watch without auto-push
node scripts/watch-and-push.js --no-push

# Show detailed file changes
node scripts/watch-and-push.js --verbose

# Custom check interval (3 seconds)
node scripts/watch-and-push.js --interval 3000

# Custom debounce delay (5 seconds)
node scripts/watch-and-push.js --debounce 5000
```

## 📋 Features

### Auto-Push Script
- ✅ Automatic git status checking
- ✅ Intelligent change detection
- ✅ Timestamp-based commit messages
- ✅ Automatic pushing to GitHub
- ✅ Error handling and logging
- ✅ Remote repository validation

### File Watcher
- ✅ Real-time file monitoring
- ✅ Debounced commits (prevents excessive commits)
- ✅ Excludes unnecessary files (node_modules, logs, etc.)
- ✅ Graceful shutdown with final commit
- ✅ Configurable intervals and delays
- ✅ Verbose logging option

## 🔧 Default Settings

### File Watcher Configuration
- **Check Interval**: 5 seconds
- **Debounce Delay**: 10 seconds
- **Auto-Push**: Enabled
- **Excluded Files**: 
  - `node_modules/`
  - `.git/`
  - `logs/`
  - `*.tmp`
  - `*.log`
  - `.env*`

## 📝 Commit Messages

The auto-push script generates timestamped commit messages:
```
Auto-commit: 2024-01-31T18-35-15 - Project updates
```

## 🛠️ Integration with Development Workflow

### Option 1: Manual Auto-Push
Make changes to your code, then run:
```bash
npm run auto-push
```

### Option 2: Real-time Watching
Start the watcher in a separate terminal:
```bash
npm run watch-push
```

The watcher will automatically commit and push changes as you work.

### Option 3: Git Hooks (Advanced)
You can integrate with Git hooks for automatic commits:
```bash
# Add to .git/hooks/pre-commit
npm run auto-push commit
```

## 🔍 Troubleshooting

### Common Issues

1. **"Not a git repository"**
   ```bash
   git init
   git remote add origin <your-repo-url>
   ```

2. **"No remote repository configured"**
   ```bash
   git remote add origin https://github.com/username/repo.git
   ```

3. **Authentication Issues**
   - Ensure GitHub token is configured
   - Check git credentials: `git config --list`

4. **Push Failures**
   - Check internet connection
   - Verify repository permissions
   - Run `node scripts/auto-push.js status` to diagnose

### Debug Mode
Enable verbose logging:
```bash
node scripts/watch-and-push.js --verbose
```

## 📊 Monitoring

The scripts provide detailed logging with timestamps:
- 🔄 Process status
- ✅ Successful operations
- ❌ Error messages
- 📋 File changes detected
- 🎉 Completion status

## 🔐 Security Notes

- Scripts use existing Git configuration
- No sensitive data stored in scripts
- Respects `.gitignore` and excludes sensitive files
- Safe for production environments

## 🚀 Best Practices

1. **Use File Watcher for Development**: Keep it running while coding
2. **Manual Commits for Important Changes**: Use `npm run commit` for specific changes
3. **Review Before Pushing**: Check status with `npm run auto-push.js status`
4. **Regular Backups**: Scripts maintain Git history automatically
5. **Team Collaboration**: Coordinate with team members when using auto-push

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Run with `--verbose` flag for detailed logs
3. Review Git configuration and permissions
4. Ensure GitHub repository is properly configured
