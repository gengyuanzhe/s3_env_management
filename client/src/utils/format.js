export function formatBytes(bytes) {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}-${d.getDate()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function resolveCommand(template, node, customVariables = []) {
  if (!template) return '';
  let result = template;
  const builtInVars = {
    internalIp: node?.internalIp,
    externalIp: node?.externalIp,
    nodeName: node?.name,
    credentials: node?.credentials,
  };
  for (const [key, value] of Object.entries(builtInVars)) {
    if (value) {
      result = result.replaceAll(`{${key}}`, value);
    }
  }
  for (const { key, value } of customVariables) {
    if (key && value) {
      result = result.replaceAll(`{${key}}`, value);
    }
  }
  return result;
}
