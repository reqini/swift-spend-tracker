# 🧪 Checklist de Pruebas - Swift Spend Tracker

## ✅ Estado Actual
- **Servidor Local**: ✅ Funcionando en http://localhost:8081
- **Build**: ✅ Exitoso
- **Linting**: ⚠️ Algunos warnings menores (no críticos)
- **Deploy**: ✅ Desplegado en Vercel

## 🔐 Pruebas de Autenticación

### 1. Registro de Usuario
- [ ] **Acceder a la app**: http://localhost:8081
- [ ] **Hacer clic en "Registrarse"**
- [ ] **Ingresar email válido** (ej: test@example.com)
- [ ] **Ingresar contraseña** (mínimo 6 caracteres)
- [ ] **Hacer clic en "Registrarse"**
- [ ] **Verificar mensaje de confirmación**
- [ ] **Revisar email de confirmación** (carpeta spam si no aparece)

### 2. Login de Usuario
- [ ] **Hacer clic en "Iniciar Sesión"**
- [ ] **Ingresar email registrado**
- [ ] **Ingresar contraseña correcta**
- [ ] **Hacer clic en "Iniciar Sesión"**
- [ ] **Verificar que accede al dashboard**

### 3. Recuperación de Contraseña
- [ ] **Hacer clic en "¿Olvidaste tu contraseña?"**
- [ ] **Verificar que aparece formulario de recuperación**
- [ ] **Ingresar email registrado**
- [ ] **Hacer clic en "Enviar Email"**
- [ ] **Verificar mensaje de confirmación**
- [ ] **Revisar email de recuperación**
- [ ] **Hacer clic en el enlace del email**
- [ ] **Verificar que redirige a /reset-password**
- [ ] **Probar contraseña débil** (debe mostrar error)
- [ ] **Ingresar contraseña fuerte** (8+ chars, mayúscula, minúscula, número, especial)
- [ ] **Confirmar contraseña**
- [ ] **Hacer clic en "Cambiar Contraseña"**
- [ ] **Verificar mensaje de éxito**
- [ ] **Verificar redirección automática al login**
- [ ] **Probar login con nueva contraseña**

## 💰 Pruebas de Funcionalidad Principal

### 4. Gestión de Transacciones
- [ ] **Agregar transacción de ingreso**
  - [ ] Seleccionar tipo "Ingreso"
  - [ ] Ingresar monto
  - [ ] Seleccionar categoría
  - [ ] Agregar descripción
  - [ ] Guardar transacción
- [ ] **Agregar transacción de gasto**
  - [ ] Seleccionar tipo "Gasto"
  - [ ] Ingresar monto
  - [ ] Seleccionar categoría
  - [ ] Agregar descripción
  - [ ] Guardar transacción
- [ ] **Verificar que aparecen en la lista**
- [ ] **Probar filtros de transacciones**
- [ ] **Probar búsqueda de transacciones**

### 5. Categorías
- [ ] **Verificar que aparecen categorías predefinidas**
- [ ] **Probar selector de categorías**
- [ ] **Verificar que las transacciones muestran categorías**

### 6. Estadísticas
- [ ] **Hacer clic en pestaña "Stats"**
- [ ] **Verificar que aparecen estadísticas**
- [ ] **Verificar gráficos de categorías**

## 👨‍👩‍👧‍👦 Pruebas de Gestión Familiar

### 7. Crear Familia
- [ ] **Hacer clic en pestaña "Familia"**
- [ ] **Crear nueva familia**
- [ ] **Ingresar nombre de familia**
- [ ] **Verificar que se crea correctamente**

### 8. Invitar Miembros
- [ ] **Hacer clic en "Invitar Miembro"**
- [ ] **Ingresar email de invitación**
- [ ] **Enviar invitación**
- [ ] **Verificar mensaje de confirmación**

## 📱 Pruebas de PWA

### 9. Instalación
- [ ] **Verificar que aparece prompt de instalación**
- [ ] **Instalar la app**
- [ ] **Verificar que funciona offline**

### 10. Notificaciones
- [ ] **Probar detección de gastos**
- [ ] **Verificar notificaciones push**

## 🔧 Pruebas Técnicas

### 11. Responsive Design
- [ ] **Probar en desktop** (1920x1080)
- [ ] **Probar en tablet** (768x1024)
- [ ] **Probar en mobile** (375x667)
- [ ] **Verificar navegación táctil**

### 12. Performance
- [ ] **Verificar tiempo de carga inicial**
- [ ] **Verificar transiciones suaves**
- [ ] **Verificar que no hay errores en consola**

### 13. Navegación
- [ ] **Probar todas las pestañas del bottom navigation**
- [ ] **Verificar que las rutas funcionan correctamente**
- [ ] **Probar navegación con botones atrás/adelante**

## 🚨 Pruebas de Error

### 14. Manejo de Errores
- [ ] **Probar login con credenciales incorrectas**
- [ ] **Probar registro con email inválido**
- [ ] **Probar recuperación con email no registrado**
- [ ] **Probar formularios vacíos**
- [ ] **Probar conexión lenta (simular)**

### 15. Validaciones
- [ ] **Probar contraseñas débiles**
- [ ] **Probar emails inválidos**
- [ ] **Probar montos negativos o cero**
- [ ] **Probar campos requeridos**

## 📋 URLs de Prueba

### Local
- **App Principal**: http://localhost:8081/
- **Recuperación**: http://localhost:8081/reset-password?token=test&type=recovery
- **404**: http://localhost:8081/pagina-inexistente

### Producción
- **App Principal**: https://swift-spend-tracker-grk1gir4d-lucianos-projects-63b5ede7.vercel.app/
- **Recuperación**: https://swift-spend-tracker-grk1gir4d-lucianos-projects-63b5ede7.vercel.app/reset-password?token=test&type=recovery

## 🎯 Criterios de Aceptación

### ✅ Funcionalidad Básica
- [ ] Usuario puede registrarse
- [ ] Usuario puede hacer login
- [ ] Usuario puede recuperar contraseña
- [ ] Usuario puede agregar transacciones
- [ ] Usuario puede ver estadísticas

### ✅ Experiencia de Usuario
- [ ] Interfaz intuitiva y fácil de usar
- [ ] Mensajes de error claros
- [ ] Estados de carga apropiados
- [ ] Navegación fluida

### ✅ Seguridad
- [ ] Contraseñas seguras requeridas
- [ ] Tokens de recuperación válidos
- [ ] Validación de formularios
- [ ] Manejo seguro de datos

### ✅ Performance
- [ ] Carga rápida
- [ ] Sin errores en consola
- [ ] Funciona en diferentes dispositivos
- [ ] PWA funcional

## 📝 Notas de Prueba

- **Email de prueba**: Usar un email real para probar recuperación
- **Contraseña fuerte**: Ejemplo: `Test123!@#`
- **Datos de prueba**: Usar montos y descripciones realistas
- **Navegador**: Probar en Chrome, Firefox, Safari
- **Dispositivo**: Probar en desktop, tablet, mobile

## 🚀 Después de las Pruebas

Si todo funciona correctamente:
1. ✅ **Hacer commit de cualquier cambio**
2. ✅ **Hacer push a main**
3. ✅ **Verificar deploy automático en Vercel**
4. ✅ **Configurar variables de entorno en Vercel**
5. ✅ **Aplicar migraciones en Supabase**
6. ✅ **Probar en producción** 