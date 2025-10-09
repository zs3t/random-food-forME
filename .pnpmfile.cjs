module.exports = {
  hooks: {
    readPackage (pkg) {
      if (pkg.name === 'better-sqlite3') {
        pkg.ignoreScripts = false
      }
      return pkg
    }
  }
}