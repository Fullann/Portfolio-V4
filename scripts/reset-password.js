require('dotenv').config();
const bcrypt = require('bcrypt');
const { dbOperations, initializeDatabase } = require('../mysql-db');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function resetPassword() {
  try {
    await initializeDatabase();
    
    const username = await new Promise(resolve => {
      rl.question('Nom d\'utilisateur admin : ', resolve);
    });
    
    const newPassword = await new Promise(resolve => {
      rl.question('Nouveau mot de passe : ', resolve);
    });
    
    const confirmPassword = await new Promise(resolve => {
      rl.question('Confirmer le mot de passe : ', resolve);
    });
    
    if (newPassword !== confirmPassword) {
      console.log('❌ Les mots de passe ne correspondent pas');
      process.exit(1);
    }
    
    if (newPassword.length < 6) {
      console.log('❌ Le mot de passe doit contenir au moins 6 caractères');
      process.exit(1);
    }
    
    const admin = await dbOperations.admin.getByUsername(username);
    
    if (!admin) {
      console.log(`❌ Utilisateur "${username}" non trouvé`);
      process.exit(1);
    }
    
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await dbOperations.admin.update(admin.id, { password: hashedPassword });
    
    console.log(`✅ Mot de passe réinitialisé pour l'utilisateur "${username}"`);
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Erreur:', error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

resetPassword();
