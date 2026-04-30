import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import { useApp } from '../../context/AppContext';
import { updateEnvironment, getEnvironments } from '../../services/api';

export default function EditEnvModal({ env, open, onClose }) {
  const { setEnvironments, addLog } = useApp();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [nodes, setNodes] = useState([]);

  useEffect(() => {
    if (env && open) {
      form.setFieldsValue({
        ...env,
        s3Endpoint: env.s3Config?.endpoint,
        s3Ak: env.s3Config?.ak,
        s3Sk: env.s3Config?.sk,
      });
      setNodes([...(env.nodes || [])]);
    }
  }, [env, open]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      const updated = {
        ...values,
        nodes,
        s3Config: { endpoint: values.s3Endpoint, ak: values.s3Ak, sk: values.s3Sk },
      };
      delete updated.s3Endpoint; delete updated.s3Ak; delete updated.s3Sk;
      await updateEnvironment(env.id, updated);
      addLog('SUCCESS', '环境更新', `${env.name}`);
      setEnvironments(await getEnvironments());
      message.success('保存成功');
      onClose();
    } catch (err) {
      message.error(err.message);
    }
    setLoading(false);
  };

  const addNode = () => setNodes([...nodes, { name: '', internalIp: '', externalIp: '', credentials: '' }]);
  const removeNode = (i) => setNodes(nodes.filter((_, idx) => idx !== i));
  const updateNode = (i, field, val) => {
    const next = [...nodes]; next[i] = { ...next[i], [field]: val }; setNodes(next);
  };

  return (
    <Modal title="编辑环境信息" open={open} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="保存修改" width={700}>
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="环境名称" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Form.Item label="CPU架构" name="cpuArch"><Input /></Form.Item>
          <Form.Item label="型号" name="model"><Input /></Form.Item>
          <Form.Item label="形态" name="form"><Input /></Form.Item>
          <Form.Item label="磁盘" name="disk"><Input /></Form.Item>
          <Form.Item label="管理界面" name="managementUrl"><Input /></Form.Item>
          <Form.Item label="账号" name="account"><Input /></Form.Item>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>节点信息 <Button size="small" onClick={addNode}>+ 添加节点</Button></div>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <Input placeholder="名称" value={n.name} onChange={(e) => updateNode(i, 'name', e.target.value)} style={{ width: 80 }} />
            <Input placeholder="内网IP" value={n.internalIp} onChange={(e) => updateNode(i, 'internalIp', e.target.value)} />
            <Input placeholder="外网IP" value={n.externalIp} onChange={(e) => updateNode(i, 'externalIp', e.target.value)} />
            <Input placeholder="凭证" value={n.credentials} onChange={(e) => updateNode(i, 'credentials', e.target.value)} style={{ width: 120 }} />
            <Button danger size="small" onClick={() => removeNode(i)}>-</Button>
          </div>
        ))}
        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>S3配置</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Form.Item label="Endpoint" name="s3Endpoint"><Input /></Form.Item>
          <Form.Item label="AK" name="s3Ak"><Input /></Form.Item>
          <Form.Item label="SK" name="s3Sk"><Input /></Form.Item>
        </div>
      </Form>
    </Modal>
  );
}
