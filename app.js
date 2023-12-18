// Main Script

const fs = require('fs');
const os = require('os');
const sql = require('mssql');
const execModule = require('child_process');
const checkDiskSpace = require('check-disk-space').default;
const readline = require('node:readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});;

let pool;

// Asking the user for the Credentials of a elevated user
process.stdout.write("Please enter the username of a user with read privileges to the SQL Server(e.g. sa, PWCE):")

readline.question('Please enter a username with read rights to the SQL-Server:', username => {
  let elevatedUsername = username;
  let elevatedPassword;
  
  readline.question('Please enter the matching password:', password => {
    elevatedPassword = password;
    readline.close();

    // Creating the SQL config with the required user and password
    let sqlConfig = {
      database: 'PWNT',
      server: 'localhost',
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

    // Create a connection pool for mssql
    pool = new sql.ConnectionPool(sqlConfig);

    // Run all required functions
    databaseSize();
    checkUpdates();
    sqlversion();
    
    checkPanelFirmware();
    checkSubPanelFirmware();
  
  })
})


// create the write Stream
const logger = fs.createWriteStream('ServiceReport.txt', {
  flags: 'a'
})
// log the Date
logger.write('Service Report for ProWatch at ' + Date() + '\n\n')

// log the OS-info
logger.write('##OS-Version: ' + os.version() + ' ' + os.release() + '\r\n');

// get DiskSpace
getDiskSpace();

// check for updates
function checkUpdates() {
  const updates = execModule.spawn('powershell.exe', [
    '(New-Object -ComObject Microsoft.Update.Session).CreateupdateSearcher().Search(\'IsHidden=0 and IsInstalled=0\').Updates | Select-Object Title'
  ])
  
  updates.stdout.on('data', (data) => {
    logger.write('##Benötigte Updates: \r\n' + data + '\r\n');
  })
}

// Get the remaining Diskspace
function getDiskSpace() {
  checkDiskSpace('C:/').then((diskSpace) => {
    const unitNumber = 0
  
    const result = formatBytes(diskSpace.free)
    const percentage = Math.round(diskSpace.free / diskSpace.size * 10000) / 100;
    logger.write( '##Free Disk Space (C:\): ' + result.toString() + '(' +percentage  + '%)\r\n')
  
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
    logger.write('##SQL Server Version: ' + JSON.stringify(result.recordset[0]['']) + '\r\n\r\n');
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
    logger.write('##Database size of PWNT(max 9,31 GiB): ' + result.recordset[0]?.database_size + '\r\n')
    if(err) {
      console.log(err);
    }
  
  })
})
}

// check firmware-versions from Panel
function checkPanelFirmware() {
  const panelFirmware = new sql.Request(pool)
pool.connect( err => {
  if (err) {
    console.log(err);
  }
  panelFirmware.query('SELECT DESCRP, LOCATION, FIRMWARE_VERSION, INSTALLED FROM Panel', (err, result) => {
    logger.write('##Panel Firmware Versions: \r\n');
    logger.write('Description:'.padEnd(64) + 'Location:'.padEnd(64) + 'Installed:'.padEnd(10) + 'Firmware Version:' + '\r\n')
    let all = [...result.recordset];
    all.forEach(line => {
        logger.write(line?.DESCRP.padEnd(64) + line?.LOCATION.padEnd(64) + line?.INSTALLED.padEnd(10)  + line?.FIRMWARE_VERSION + '\r\n');
    })
    logger.write('\r\n\r\n');
    if(err) {
      console.log(err);
    }
  
  })
})
}
// check firmware-versions from SubPanels
function checkSubPanelFirmware() {
  const subpanelFirmware = new sql.Request(pool)
pool.connect( err => {
  if (err) {
    console.log(err);
  }
  subpanelFirmware.query('SELECT HWDESCRP, DESCRP, SPANEL.FIRMWARE_VERSION, SPANEL.INSTALLED FROM SPANEL INNER JOIN Panel on SPANEL.PPID LIKE (PANEL.PPID + \'00\')', (err, result) => {
    logger.write('##Sub-Panel Firmware Versions: \r\n');
    logger.write('Description:'.padEnd(64) + 'Connected to Controller:'.padEnd(64) + 'Installed:'.padEnd(10) + 'Firmware Version:' + '\r\n')
    let all = [...result.recordset];
    all.forEach(line => {

        logger.write(line?.HWDESCRP.padEnd(64) + line?.DESCRP.padEnd(64) + line?.INSTALLED.padEnd(10) + line?.FIRMWARE_VERSION + '\r\n');

    })
    logger.write('\r\n\r\n');
    if(err) {
      console.log(err);
    }
  
  })
})
}


// Helper functions

// Format Bytes into KiB, MiB etc.
function formatBytes (bytes, decimals = 2) {
  if (!+bytes) return '0 Bytes'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}
