/**
 * Database Backup & Recovery Utility for Agentic Event Management Platform
 * 
 * Usage:
 *   node backend/scripts/backup.js create
 *   node backend/scripts/backup.js restore <filename-or-timestamp>
 *   node backend/scripts/backup.js list
 */

const fs = require('fs');
const path = require('path');

const BACKEND_DIR = path.join(__dirname, '..');
const BACKUPS_DIR = path.join(BACKEND_DIR, 'backups');

const ENTITY_FILES = [
    'registrations.json',
    'users.json',
    'events.json',
    'sessions.json',
    'venues.json',
    'speakers.json',
    'sponsors.json',
    'sponsorship_packages.json',
    'sponsorship_proposals.json',
    'sponsor_payments.json',
    'sponsor_requirements.json',
    'incidents.json',
    'technicians.json',
    'alerts.json',
    'orchestration_workflows.json'
];

function ensureBackupsDir() {
    if (!fs.existsSync(BACKUPS_DIR)) {
        fs.mkdirSync(BACKUPS_DIR, { recursive: true });
    }
}

function createBackup() {
    ensureBackupsDir();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;
    const targetFolder = path.join(BACKUPS_DIR, backupName);
    fs.mkdirSync(targetFolder, { recursive: true });

    let filesCopied = 0;
    const manifest = {
        timestamp: new Date().toISOString(),
        backupName,
        files: []
    };

    for (const file of ENTITY_FILES) {
        const sourcePath = path.join(BACKEND_DIR, file);
        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(targetFolder, file);
            fs.copyFileSync(sourcePath, destPath);
            const stats = fs.statSync(sourcePath);
            manifest.files.push({ file, size: stats.size });
            filesCopied++;
        }
    }

    fs.writeFileSync(
        path.join(targetFolder, 'manifest.json'),
        JSON.stringify(manifest, null, 2),
        'utf8'
    );

    console.log(`[BACKUP SUCCESS] Snapshot created at: ${targetFolder}`);
    console.log(`[BACKUP SUMMARY] ${filesCopied} entity files preserved.`);
    return targetFolder;
}

function listBackups() {
    ensureBackupsDir();
    const entries = fs.readdirSync(BACKUPS_DIR, { withFileTypes: true });
    const backups = entries
        .filter(entry => entry.isDirectory() && entry.name.startsWith('backup_'))
        .map(entry => {
            const folderPath = path.join(BACKUPS_DIR, entry.name);
            const manifestPath = path.join(folderPath, 'manifest.json');
            let meta = { timestamp: 'Unknown', filesCount: 0 };
            if (fs.existsSync(manifestPath)) {
                try {
                    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                    meta = { timestamp: manifest.timestamp, filesCount: manifest.files?.length || 0 };
                } catch (e) { }
            }
            return { name: entry.name, ...meta };
        });

    console.log(`\n=== Database Backup Snapshots (${backups.length} found) ===`);
    backups.forEach((b, idx) => {
        console.log(`${idx + 1}. ${b.name} | Created: ${b.timestamp} | Files: ${b.filesCount}`);
    });
    return backups;
}

function restoreBackup(targetName) {
    ensureBackupsDir();
    if (!targetName) {
        console.error('Error: Please specify the backup folder name to restore.');
        process.exit(1);
    }

    let folderPath = path.join(BACKUPS_DIR, targetName);
    if (!fs.existsSync(folderPath)) {
        const backups = fs.readdirSync(BACKUPS_DIR).filter(n => n.includes(targetName));
        if (backups.length > 0) {
            folderPath = path.join(BACKUPS_DIR, backups[0]);
        } else {
            console.error(`Error: Backup '${targetName}' not found in ${BACKUPS_DIR}`);
            process.exit(1);
        }
    }

    console.log(`[RESTORE] Restoring database snapshot from: ${folderPath}`);
    let restoredCount = 0;

    for (const file of ENTITY_FILES) {
        const sourcePath = path.join(folderPath, file);
        if (fs.existsSync(sourcePath)) {
            const destPath = path.join(BACKEND_DIR, file);
            fs.copyFileSync(sourcePath, destPath);
            restoredCount++;
        }
    }

    console.log(`[RESTORE SUCCESS] ${restoredCount} database entities restored successfully.`);
}

const command = process.argv[2] || 'create';
const param = process.argv[3];

switch (command) {
    case 'create':
        createBackup();
        break;
    case 'list':
        listBackups();
        break;
    case 'restore':
        restoreBackup(param);
        break;
    default:
        console.log('Usage: node backend/scripts/backup.js [create|list|restore <name>]');
}

module.exports = { createBackup, restoreBackup, listBackups };
