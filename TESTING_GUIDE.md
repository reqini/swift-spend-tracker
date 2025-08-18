# 🧪 Guía de Pruebas - Mis Finanzas Rápidas

## 📋 Estado Actual de la Aplicación

### ✅ **Funcionalidades Implementadas:**
- ✅ Registro y login de usuarios
- ✅ Creación y gestión de familias
- ✅ Agregar transacciones (ingresos/gastos)
- ✅ Categorización de transacciones
- ✅ Invitaciones de familiares
- ✅ Notificaciones push
- ✅ PWA (Progressive Web App)
- ✅ Recuperación de contraseña
- ✅ Filtros y búsqueda de transacciones
- ✅ Estadísticas y gráficos

### ⚠️ **Problemas Conocidos:**
- ⚠️ **Base de datos**: Necesita aplicar migraciones en Supabase Cloud
- ⚠️ **Políticas RLS**: Error de recursión infinita en family_members

---

## 🔧 **PASO 1: Aplicar Migraciones de Base de Datos**

### **Opción A: Usando Supabase Dashboard**
1. Ir a [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleccionar proyecto: `deensmuaonpjvgkbcnwk`
3. Ir a **SQL Editor**
4. Copiar y pegar el contenido de `fix_database.sql`
5. Ejecutar el script

### **Opción B: Usando Supabase CLI**
```bash
# Si tienes Supabase CLI configurado
npx supabase db push
```

---

## 🧪 **PASO 2: Pruebas de Funcionalidad**

### **🌐 Acceso a la Aplicación**
- **URL**: http://localhost:8081/
- **Servidor**: Debe estar corriendo con `npm run dev`

---

## 📝 **FLUJOS DE PRUEBA DETALLADOS**

### **A. 🔐 REGISTRO Y LOGIN**

#### **A.1 Registro de Usuario**
1. **Abrir** http://localhost:8081/
2. **Click** en "Registrarse"
3. **Ingresar**:
   - Email: `test@example.com`
   - Contraseña: `testpassword123`
4. **Click** en "Crear cuenta"
5. **Verificar** mensaje de confirmación
6. **Verificar** email (si es necesario)

#### **A.2 Login de Usuario**
1. **Ingresar** credenciales:
   - Email: `test@example.com`
   - Contraseña: `testpassword123`
2. **Click** en "Iniciar sesión"
3. **Verificar** que accede al dashboard

#### **A.3 Recuperación de Contraseña**
1. **Click** en "¿Olvidaste tu contraseña?"
2. **Ingresar** nueva contraseña: `newpassword123`
3. **Click** en "Actualizar Contraseña"
4. **Verificar** mensaje de confirmación

---

### **B. 👨‍👩‍👧‍👦 GESTIÓN DE FAMILIAS**

#### **B.1 Crear Familia**
1. **Click** en "Gestión Familiar"
2. **Seleccionar** pestaña "Crear Familia"
3. **Ingresar** nombre: `Familia García`
4. **Click** en "Crear Familia"
5. **Verificar** mensaje de confirmación
6. **Verificar** que aparece en el panel

#### **B.2 Invitar Miembros**
1. **En** "Gestión Familiar"
2. **Click** en "Invitar Miembro"
3. **Ingresar** email: `familiar@example.com`
4. **Click** en "Enviar Invitación"
5. **Verificar** mensaje de confirmación
6. **Verificar** que aparece en la lista de invitaciones

#### **B.3 Ver Miembros**
1. **Verificar** que aparece el usuario actual como admin
2. **Verificar** que se muestran los roles correctos

---

### **C. 💰 GESTIÓN DE TRANSACCIONES**

#### **C.1 Agregar Ingreso**
1. **Click** en "Agregar Transacción"
2. **Seleccionar** tipo: "Ingreso"
3. **Ingresar** monto: `5000`
4. **Seleccionar** categoría: "Salario"
5. **Agregar** descripción: `Salario mensual`
6. **Click** en "Agregar"
7. **Verificar** que aparece en la lista
8. **Verificar** que se actualiza el balance

#### **C.2 Agregar Gasto**
1. **Click** en "Agregar Transacción"
2. **Seleccionar** tipo: "Gasto"
3. **Ingresar** monto: `150`
4. **Seleccionar** categoría: "Alimentación"
5. **Agregar** descripción: `Supermercado`
6. **Click** en "Agregar"
7. **Verificar** que aparece en la lista
8. **Verificar** que se actualiza el balance

#### **C.3 Editar Transacción**
1. **Click** en el botón "Editar" de una transacción
2. **Modificar** monto o descripción
3. **Click** en "Guardar"
4. **Verificar** que se actualiza correctamente

#### **C.4 Filtrar Transacciones**
1. **Usar** filtros por tipo (Ingreso/Gasto)
2. **Usar** filtros por categoría
3. **Usar** búsqueda por texto
4. **Verificar** que los filtros funcionan

---

### **D. 📊 ESTADÍSTICAS Y GRÁFICOS**

#### **D.1 Ver Estadísticas**
1. **Click** en pestaña "Estadísticas"
2. **Verificar** gráficos de categorías
3. **Verificar** listas de top categorías
4. **Verificar** porcentajes correctos

#### **D.2 Ver Gráficos**
1. **Verificar** gráfico de barras para gastos
2. **Verificar** gráfico de barras para ingresos
3. **Verificar** que los datos son correctos

---

### **E. 🔔 NOTIFICACIONES**

#### **E.1 Notificaciones Push**
1. **Click** en "Solicitar Notificaciones"
2. **Aceptar** permisos en el navegador
3. **Click** en "Simular Detección"
4. **Verificar** que aparece la notificación
5. **Click** en "Registrar" en la notificación
6. **Verificar** que se abre el formulario

#### **E.2 Monitoreo de Portapapeles**
1. **Click** en "Iniciar Monitoreo"
2. **Copiar** texto con patrón de transacción
3. **Verificar** que se detecta automáticamente
4. **Click** en "Detener Monitoreo"

---

### **F. 📱 PWA (Progressive Web App)**

#### **F.1 Instalación**
1. **Verificar** que aparece el prompt de instalación
2. **Click** en "Instalar"
3. **Verificar** que se instala correctamente
4. **Verificar** que funciona offline

#### **F.2 Funcionalidad Offline**
1. **Desconectar** internet
2. **Verificar** que la app sigue funcionando
3. **Reconectar** internet
4. **Verificar** que se sincroniza

---

## 🐛 **SOLUCIÓN DE PROBLEMAS**

### **Error: "infinite recursion detected in policy"**
**Solución**: Aplicar el script `fix_database.sql` en Supabase Dashboard

### **Error: "Could not find the table"**
**Solución**: Las tablas no existen, aplicar migraciones

### **Error: "No se pueden cargar transacciones"**
**Solución**: Verificar conexión a Supabase y políticas RLS

### **Error: "No se puede crear familia"**
**Solución**: Verificar que el usuario está autenticado

---

## ✅ **CRITERIOS DE ÉXITO**

### **Funcionalidades Críticas:**
- ✅ Usuario puede registrarse y hacer login
- ✅ Usuario puede crear una familia
- ✅ Usuario puede agregar transacciones
- ✅ Usuario puede ver estadísticas
- ✅ Usuario puede cambiar contraseña

### **Funcionalidades Secundarias:**
- ✅ Invitaciones de familiares funcionan
- ✅ Notificaciones push funcionan
- ✅ PWA se puede instalar
- ✅ Filtros y búsqueda funcionan
- ✅ Edición de transacciones funciona

---

## 📞 **SOPORTE**

Si encuentras problemas:
1. **Verificar** la consola del navegador (F12)
2. **Verificar** que Supabase está funcionando
3. **Verificar** que las migraciones están aplicadas
4. **Revisar** los logs en la terminal

---

## 🎯 **PRÓXIMOS PASOS**

Después de completar las pruebas:
1. **Reportar** cualquier problema encontrado
2. **Sugerir** mejoras de UX/UI
3. **Proponer** nuevas funcionalidades
4. **Optimizar** rendimiento si es necesario 