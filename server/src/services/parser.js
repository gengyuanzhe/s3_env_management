import { v4 as uuidv4 } from 'uuid';

export function parseEnvironmentText(text) {
  const errors = [];
  const env = {
    id: uuidv4(),
    name: '',
    envId: '',
    instanceId: '',
    model: '',
    cpuArch: '',
    form: '',
    disk: '',
    managementUrl: '',
    account: '',
    password: '',
    sdeName: '',
    nodes: [],
    s3Config: { endpoint: '', ak: '', sk: '' },
    createdAt: new Date().toISOString(),
  };

  const lines = text.split('\n').map(l => l.trimEnd());

  function match(line, pattern) {
    const m = line.trim().match(pattern);
    return m ? m[1].trim() : null;
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('---')) continue;

    let v;
    if ((v = match(line, /^环境名称\s*:?\s*(.+)/))) { env.name = v; continue; }
    if ((v = match(line, /^环境ID\s*:?\s*(.+)/))) { env.envId = v; continue; }
    if ((v = match(line, /^实例ID\s*:?\s*(.+)/))) { env.instanceId = v; continue; }
    if ((v = match(line, /^型号\s*:?\s*(.+)/))) { env.model = v; continue; }
    if ((v = match(line, /^CPU架构\s*:?\s*(.+)/))) { env.cpuArch = v; continue; }
    if ((v = match(line, /^形态\s*:?\s*(.+)/))) { env.form = v; continue; }
    if ((v = match(line, /^盘\s*:?\s*(.+)/))) { env.disk = v; continue; }
    if ((v = match(line, /^管理界面\s*:?\s*(.+)/))) { env.managementUrl = v; continue; }
    if ((v = match(line, /^账号\s*:?\s*(.+)/))) { env.account = v; continue; }
    if ((v = match(line, /^密码\s*:?\s*(.+)/))) { env.password = v; continue; }
    if ((v = match(line, /^SDE Name\s*:?\s*(.+)/))) { env.sdeName = v; continue; }
    if ((v = match(line, /^Endpoint\s*:?\s*(.+)/))) { env.s3Config.endpoint = v; continue; }
    if ((v = match(line, /^AK\s*:?\s*(.+)/))) { env.s3Config.ak = v; continue; }
    if ((v = match(line, /^SK\s*:?\s*(.+)/))) { env.s3Config.sk = v; continue; }
  }

  // Parse nodes: indented lines "NAME INTERNAL_IP EXTERNAL_IP USER/PWD"
  const nodePattern = /^\s+(\S+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\d+\.\d+\.\d+\.\d+)\s+(\S+\/\S+)/;
  for (const line of lines) {
    const m = line.match(nodePattern);
    if (m) {
      env.nodes.push({
        name: m[1],
        internalIp: m[2],
        externalIp: m[3],
        credentials: m[4],
      });
    }
  }

  if (!env.name) errors.push('环境名称未解析到');
  if (env.nodes.length === 0) errors.push('未解析到节点信息');

  return { data: env, errors };
}
