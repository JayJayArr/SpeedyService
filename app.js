// Start by creating a file that keeps the output

const fs = require('fs');
const os = require('os');
const sql = require('mssql');
const execModule = require('child_process');
const checkDiskSpace = require('check-disk-space').default;
const readline = require('node:readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});;

// Asking the user for the Credentials of a elevated user
let elevatedUsername;
let elevatedPassword;
let sqlConfig;
let pool;
process.stdout.write("Please enter the username of a user with read privileges to the SQL Server:")

readline.question('Please enter a username with read rights to the SQL-Server:', username => {
  elevatedUsername = username;
  readline.question('Please enter the matching password:', password => {
    elevatedPassword = password;
    console.log(elevatedPassword);
    readline.close();
  
    sqlConfig = {
      user: elevatedUsername,
      password: elevatedPassword,
      database: 'PWNT',
      server: '127.0.0.1',
      pool: {
        max: 25,
        min: 0,
        idleTimeoutMillis: 30000
      },
      options: {
        encrypt: false, // for azure
        trustServerCertificate: true // change to true for local dev /
      }
    }
    sqlConfig['user'] = elevatedUsername;
    sqlConfig['password'] = elevatedPassword;

    console.log(sqlConfig);
    // Create a connection pool for mssql
    pool = new sql.ConnectionPool(sqlConfig);
    checkUpdates();
    getDiskSpace();
    sqlversion();
    databaseSize();
  
  })
})



// Creating the SQL config



// create the write Stream
const logger = fs.createWriteStream('ServiceReport.txt', {
  flags: 'a'
})
// log the Date
logger.write('Service Report for ProWatch at ' + Date() + '\n\n')

// log the OS-info
logger.write('OS-Version: ' + os.version() + ' ' + os.release() + '\r\n');




// check for updates
function checkUpdates() {
  const updates = execModule.spawn('powershell.exe', [
    '(New-Object -ComObject Microsoft.Update.Session).CreateupdateSearcher().Search(\'IsHidden=0 and IsInstalled=0\').Updates | Select-Object Title'
  ])
  
  updates.stdout.on('data', (data) => {
    logger.write('Benötigte Updates: \r\n' + data + '\r\n');
  })
}

// Get the remaining Diskspace and log it
function getDiskSpace() {
  checkDiskSpace('C:/').then((diskSpace) => {
    const unitNumber = 0
  
    const result = formatBytes(diskSpace.free)
    const percentage = Math.round(diskSpace.free / diskSpace.size * 10000) / 100;
    logger.write( 'Free Disk Space (C:\): ' + result.toString() + '(' +percentage  + '%)\r\n')
  
  })
}

// SQL queries:

// Log the SQL-Version
function sqlversion() {
  const versionmssql = new sql.Request(pool)
pool.connect( err => {
  if (err) {
    console.log(err);
  }
  versionmssql.query('select @@version', (err, result) => {
    logger.write('SQL Server Version: ' + JSON.stringify(result.recordset[0]) + '\r\n\r\n');
    if(err) {
      console.log(err);
    }
  
  })
})
}

// check Database size
function databaseSize() {
  const dbSizemssql = new sql.Request(pool)
pool.connect( err => {
  if (err) {
    console.log(err);
  }
  dbSizemssql.execute('sp_spaceused', (err, result) => {
    logger.write('Database size of PWNT(max 9,31 GiB): ' + result.recordset[0]?.database_size + '\r\n')
    if(err) {
      console.log(err);
    }
  
  })
})
}



// Helper functions

/**
 *
 * @param {*} bytes
 * @param {*} decimals
 * @returns
 */
function formatBytes (bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
