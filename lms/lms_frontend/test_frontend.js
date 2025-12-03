/**
 * Frontend test script - checks file structure and dependencies
 */
const fs = require('fs');
const path = require('path');

console.log('='.repeat(70));
console.log('FRONTEND TEST');
console.log('='.repeat(70));

const frontendPath = __dirname;
const srcPath = path.join(frontendPath, 'src');

// 1. Check package.json
console.log('\n[1] PACKAGE.JSON');
try {
  const pkg = JSON.parse(fs.readFileSync(path.join(frontendPath, 'package.json'), 'utf8'));
  const deps = pkg.dependencies || {};
  const required = ['react', 'react-dom', 'react-router-dom', 'axios'];
  required.forEach(dep => {
    if (deps[dep]) {
      console.log(`   ✓ ${dep.padEnd(20)} - ${deps[dep]}`);
    } else {
      console.log(`   ✗ ${dep.padEnd(20)} - MISSING`);
    }
  });
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// 2. Check file structure
console.log('\n[2] FILE STRUCTURE');
const files = {
  'package.json': path.join(frontendPath, 'package.json'),
  'vite.config.js': path.join(frontendPath, 'vite.config.js'),
  'index.html': path.join(frontendPath, 'index.html'),
  'api/client.js': path.join(srcPath, 'api', 'client.js'),
  'context/AuthContext.jsx': path.join(srcPath, 'context', 'AuthContext.jsx'),
  'components/Navbar.jsx': path.join(srcPath, 'components', 'Navbar.jsx'),
  'components/CourseCard.jsx': path.join(srcPath, 'components', 'CourseCard.jsx'),
  'pages/Home.jsx': path.join(srcPath, 'pages', 'Home.jsx'),
  'pages/Login.jsx': path.join(srcPath, 'pages', 'Login.jsx'),
  'pages/Register.jsx': path.join(srcPath, 'pages', 'Register.jsx'),
  'pages/CourseDetail.jsx': path.join(srcPath, 'pages', 'CourseDetail.jsx'),
  'pages/StudentDashboard.jsx': path.join(srcPath, 'pages', 'StudentDashboard.jsx'),
  'routes/AppRouter.jsx': path.join(srcPath, 'routes', 'AppRouter.jsx'),
  'App.jsx': path.join(srcPath, 'App.jsx'),
  'main.jsx': path.join(srcPath, 'main.jsx'),
};

Object.entries(files).forEach(([name, filePath]) => {
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${name}`);
  } else {
    console.log(`   ✗ ${name} - MISSING`);
  }
});

// 3. Check API client
console.log('\n[3] API CLIENT');
try {
  const clientContent = fs.readFileSync(path.join(srcPath, 'api', 'client.js'), 'utf8');
  const checks = {
    'baseURL localhost:8000': clientContent.includes('localhost:8000'),
    'axios import': clientContent.includes('import axios'),
    'interceptors': clientContent.includes('interceptors'),
    'authAPI': clientContent.includes('authAPI'),
    'coursesAPI': clientContent.includes('coursesAPI'),
    'enrollmentsAPI': clientContent.includes('enrollmentsAPI'),
  };
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✓' : '✗'} ${check}`);
  });
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// 4. Check AuthContext
console.log('\n[4] AUTH CONTEXT');
try {
  const authContent = fs.readFileSync(path.join(srcPath, 'context', 'AuthContext.jsx'), 'utf8');
  const checks = {
    'useAuth hook': authContent.includes('useAuth'),
    'login method': authContent.includes('login'),
    'register method': authContent.includes('register'),
    'logout method': authContent.includes('logout'),
    'localStorage': authContent.includes('localStorage'),
  };
  Object.entries(checks).forEach(([check, passed]) => {
    console.log(`   ${passed ? '✓' : '✗'} ${check}`);
  });
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// 5. Check Routes
console.log('\n[5] ROUTES');
try {
  const routerContent = fs.readFileSync(path.join(srcPath, 'routes', 'AppRouter.jsx'), 'utf8');
  const routes = {
    'Home route': routerContent.includes('path="/"'),
    'Login route': routerContent.includes('/login'),
    'Register route': routerContent.includes('/register'),
    'CourseDetail route': routerContent.includes('courses/'),
    'Dashboard route': routerContent.includes('/dashboard'),
    'ProtectedRoute': routerContent.includes('ProtectedRoute'),
  };
  Object.entries(routes).forEach(([route, exists]) => {
    console.log(`   ${exists ? '✓' : '✗'} ${route}`);
  });
} catch (e) {
  console.log(`   ✗ Error: ${e.message}`);
}

// 6. Check CSS files
console.log('\n[6] STYLES');
const cssFiles = [
  'App.css',
  'components/Navbar.css',
  'components/CourseCard.css',
  'pages/Home.css',
  'pages/Auth.css',
  'pages/CourseDetail.css',
  'pages/StudentDashboard.css',
];
cssFiles.forEach(css => {
  const cssPath = path.join(srcPath, css);
  if (fs.existsSync(cssPath)) {
    console.log(`   ✓ ${css}`);
  } else {
    console.log(`   ✗ ${css} - MISSING`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('FRONTEND TEST COMPLETE');
console.log('='.repeat(70));

