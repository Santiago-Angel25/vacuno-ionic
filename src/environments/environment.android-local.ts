// El acceso al backend del PC requiere adb reverse tcp:8080 tcp:8080.
export const environment = {
  production: true,
  apiUrl: 'http://localhost:8080/api/v1',
};
