// Script de prueba automatizada para la aplicación
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://deensmuaonpjvgkbcnwk.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRlZW5zbXVhb25wanZna2JjbndrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU1MjIwMjksImV4cCI6MjA3MTA5ODAyOX0.Ptfl7ofZWmO-612HnWKFzuLWqE3OqwmYnoUBvbYHqrI";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

class AppTester {
  constructor() {
    this.testResults = [];
    this.currentUser = null;
  }

  async runAllTests() {
    console.log('🧪 INICIANDO PRUEBAS AUTOMATIZADAS DE LA APLICACIÓN\n');
    
    try {
      await this.testDatabaseConnection();
      await this.testUserRegistration();
      await this.testUserLogin();
      await this.testFamilyCreation();
      await this.testTransactionCreation();
      await this.testFamilyInvitations();
      
      this.printResults();
    } catch (error) {
      console.error('❌ Error en las pruebas:', error);
    }
  }

  async testDatabaseConnection() {
    console.log('📋 TEST 1: Verificar conexión y tablas...');
    
    const tables = ['families', 'family_members', 'family_invitations', 'family_notifications', 'transactions'];
    let allTablesOk = true;
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('count')
          .limit(1);
        
        if (error) {
          console.log(`❌ Error con tabla ${table}:`, error.message);
          allTablesOk = false;
          this.testResults.push({ test: `Database Table ${table}`, status: 'FAILED', error: error.message });
        } else {
          console.log(`✅ Tabla ${table} existe y es accesible`);
          this.testResults.push({ test: `Database Table ${table}`, status: 'PASSED' });
        }
      } catch (error) {
        console.log(`❌ Error crítico con tabla ${table}:`, error.message);
        allTablesOk = false;
        this.testResults.push({ test: `Database Table ${table}`, status: 'FAILED', error: error.message });
      }
    }
    
    if (allTablesOk) {
      console.log('✅ Todas las tablas están funcionando correctamente\n');
    } else {
      console.log('⚠️  Algunas tablas tienen problemas. Revisar migraciones.\n');
    }
  }

  async testUserRegistration() {
    console.log('👤 TEST 2: Probar registro de usuario...');
    
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'testpassword123';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      if (error) {
        console.log('❌ Error en registro:', error.message);
        this.testResults.push({ test: 'User Registration', status: 'FAILED', error: error.message });
      } else {
        console.log('✅ Registro exitoso para:', testEmail);
        console.log('📧 Verificar email para confirmar cuenta');
        this.testResults.push({ test: 'User Registration', status: 'PASSED' });
        
        // Guardar credenciales para login test
        this.testCredentials = { email: testEmail, password: testPassword };
      }
    } catch (error) {
      console.log('❌ Error crítico en registro:', error.message);
      this.testResults.push({ test: 'User Registration', status: 'FAILED', error: error.message });
    }
    
    console.log('');
  }

  async testUserLogin() {
    console.log('🔐 TEST 3: Probar login de usuario...');
    
    if (!this.testCredentials) {
      console.log('⚠️  No hay credenciales de prueba disponibles');
      this.testResults.push({ test: 'User Login', status: 'SKIPPED', reason: 'No test credentials' });
      console.log('');
      return;
    }
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: this.testCredentials.email,
        password: this.testCredentials.password
      });
      
      if (error) {
        console.log('❌ Error en login:', error.message);
        this.testResults.push({ test: 'User Login', status: 'FAILED', error: error.message });
      } else {
        console.log('✅ Login exitoso');
        this.currentUser = data.user;
        this.testResults.push({ test: 'User Login', status: 'PASSED' });
      }
    } catch (error) {
      console.log('❌ Error crítico en login:', error.message);
      this.testResults.push({ test: 'User Login', status: 'FAILED', error: error.message });
    }
    
    console.log('');
  }

  async testFamilyCreation() {
    console.log('👨‍👩‍👧‍👦 TEST 4: Probar creación de familia...');
    
    if (!this.currentUser) {
      console.log('⚠️  Usuario no autenticado, saltando prueba');
      this.testResults.push({ test: 'Family Creation', status: 'SKIPPED', reason: 'User not authenticated' });
      console.log('');
      return;
    }
    
    try {
      const familyName = `Test Family ${Date.now()}`;
      
      // Crear familia
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          created_by: this.currentUser.id
        })
        .select()
        .single();
      
      if (familyError) {
        console.log('❌ Error creando familia:', familyError.message);
        this.testResults.push({ test: 'Family Creation', status: 'FAILED', error: familyError.message });
        return;
      }
      
      // Agregar usuario como admin
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          family_id: family.id,
          user_id: this.currentUser.id,
          role: 'admin'
        });
      
      if (memberError) {
        console.log('❌ Error agregando usuario a familia:', memberError.message);
        this.testResults.push({ test: 'Family Creation', status: 'FAILED', error: memberError.message });
        return;
      }
      
      console.log('✅ Familia creada exitosamente:', familyName);
      this.testResults.push({ test: 'Family Creation', status: 'PASSED' });
      this.testFamilyId = family.id;
      
    } catch (error) {
      console.log('❌ Error crítico en creación de familia:', error.message);
      this.testResults.push({ test: 'Family Creation', status: 'FAILED', error: error.message });
    }
    
    console.log('');
  }

  async testTransactionCreation() {
    console.log('💰 TEST 5: Probar creación de transacciones...');
    
    if (!this.currentUser) {
      console.log('⚠️  Usuario no autenticado, saltando prueba');
      this.testResults.push({ test: 'Transaction Creation', status: 'SKIPPED', reason: 'User not authenticated' });
      console.log('');
      return;
    }
    
    try {
      // Crear transacción de ingreso
      const { data: income, error: incomeError } = await supabase
        .from('transactions')
        .insert({
          user_id: this.currentUser.id,
          family_id: this.testFamilyId,
          amount: 5000,
          type: 'income',
          date: new Date().toISOString(),
          description: 'Salario de prueba',
          category: 'salary'
        })
        .select()
        .single();
      
      if (incomeError) {
        console.log('❌ Error creando ingreso:', incomeError.message);
        this.testResults.push({ test: 'Transaction Creation', status: 'FAILED', error: incomeError.message });
        return;
      }
      
      // Crear transacción de gasto
      const { data: expense, error: expenseError } = await supabase
        .from('transactions')
        .insert({
          user_id: this.currentUser.id,
          family_id: this.testFamilyId,
          amount: 150,
          type: 'expense',
          date: new Date().toISOString(),
          description: 'Gasto de prueba',
          category: 'food'
        })
        .select()
        .single();
      
      if (expenseError) {
        console.log('❌ Error creando gasto:', expenseError.message);
        this.testResults.push({ test: 'Transaction Creation', status: 'FAILED', error: expenseError.message });
        return;
      }
      
      console.log('✅ Transacciones creadas exitosamente');
      console.log('   - Ingreso: $5000 (Salario)');
      console.log('   - Gasto: $150 (Comida)');
      this.testResults.push({ test: 'Transaction Creation', status: 'PASSED' });
      
    } catch (error) {
      console.log('❌ Error crítico en creación de transacciones:', error.message);
      this.testResults.push({ test: 'Transaction Creation', status: 'FAILED', error: error.message });
    }
    
    console.log('');
  }

  async testFamilyInvitations() {
    console.log('📧 TEST 6: Probar invitaciones de familia...');
    
    if (!this.currentUser || !this.testFamilyId) {
      console.log('⚠️  Usuario o familia no disponible, saltando prueba');
      this.testResults.push({ test: 'Family Invitations', status: 'SKIPPED', reason: 'User or family not available' });
      console.log('');
      return;
    }
    
    try {
      const testInviteEmail = `invite${Date.now()}@example.com`;
      
      // Crear invitación
      const { data: invitation, error: inviteError } = await supabase
        .from('family_invitations')
        .insert({
          family_id: this.testFamilyId,
          invited_email: testInviteEmail,
          invited_by: this.currentUser.id
        })
        .select()
        .single();
      
      if (inviteError) {
        console.log('❌ Error creando invitación:', inviteError.message);
        this.testResults.push({ test: 'Family Invitations', status: 'FAILED', error: inviteError.message });
        return;
      }
      
      console.log('✅ Invitación creada exitosamente para:', testInviteEmail);
      console.log('   - Token:', invitation.token);
      console.log('   - Expira:', new Date(invitation.expires_at).toLocaleString());
      this.testResults.push({ test: 'Family Invitations', status: 'PASSED' });
      
    } catch (error) {
      console.log('❌ Error crítico en invitaciones:', error.message);
      this.testResults.push({ test: 'Family Invitations', status: 'FAILED', error: error.message });
    }
    
    console.log('');
  }

  printResults() {
    console.log('📊 RESULTADOS DE LAS PRUEBAS\n');
    console.log('='.repeat(60));
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const skipped = this.testResults.filter(r => r.status === 'SKIPPED').length;
    const total = this.testResults.length;
    
    console.log(`✅ PASADAS: ${passed}`);
    console.log(`❌ FALLIDAS: ${failed}`);
    console.log(`⚠️  OMITIDAS: ${skipped}`);
    console.log(`📊 TOTAL: ${total}`);
    console.log('');
    
    this.testResults.forEach((result, index) => {
      const status = result.status === 'PASSED' ? '✅' : result.status === 'FAILED' ? '❌' : '⚠️';
      console.log(`${index + 1}. ${status} ${result.test}`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      if (result.reason) {
        console.log(`   Razón: ${result.reason}`);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    
    if (failed === 0) {
      console.log('🎉 ¡TODAS LAS PRUEBAS PASARON! La aplicación está funcionando correctamente.');
    } else {
      console.log('⚠️  Algunas pruebas fallaron. Revisar los errores y aplicar correcciones.');
    }
    
    console.log('\n🌐 Para probar la interfaz web:');
    console.log('1. Abrir http://localhost:8081/');
    console.log('2. Registrar un nuevo usuario');
    console.log('3. Probar todas las funcionalidades manualmente');
  }
}

// Ejecutar pruebas
const tester = new AppTester();
tester.runAllTests(); 