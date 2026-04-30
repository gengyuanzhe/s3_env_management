import React, { useState, useEffect } from 'react';
import { Modal, Form, Input, Button, Collapse, message } from 'antd';
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
      addLog('SUCCESS', 'Update Env', env.name);
      setEnvironments(await getEnvironments());
      message.success('Saved');
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
    <Modal title="Edit Environment" open={open} onCancel={onClose} onOk={handleSave} confirmLoading={loading} okText="Save" width={700}>
      <Form form={form} layout="vertical" size="small">
        <Form.Item label="Name" name="name" rules={[{ required: true }]}><Input /></Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <Form.Item label="CPU Arch" name="cpuArch"><Input /></Form.Item>
          <Form.Item label="Model" name="model"><Input /></Form.Item>
          <Form.Item label="Form" name="form"><Input /></Form.Item>
          <Form.Item label="Disk" name="disk"><Input /></Form.Item>
          <Form.Item label="Management URL" name="managementUrl"><Input /></Form.Item>
          <Form.Item label="Account" name="account"><Input /></Form.Item>
        </div>
        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>Nodes <Button size="small" onClick={addNode}>+ Add Node</Button></div>
        {nodes.map((n, i) => (
          <div key={i} style={{ display: 'flex', gap: 4, marginBottom: 4, alignItems: 'center' }}>
            <Input placeholder="Name" value={n.name} onChange={(e) => updateNode(i, 'name', e.target.value)} style={{ width: 80 }} />
            <Input placeholder="Internal IP" value={n.internalIp} onChange={(e) => updateNode(i, 'internalIp', e.target.value)} />
            <Input placeholder="External IP" value={n.externalIp} onChange={(e) => updateNode(i, 'externalIp', e.target.value)} />
            <Input placeholder="Credentials" value={n.credentials} onChange={(e) => updateNode(i, 'credentials', e.target.value)} style={{ width: 120 }} />
            <Button danger size="small" onClick={() => removeNode(i)}>-</Button>
          </div>
        ))}
        <div style={{ fontWeight: 600, marginBottom: 8, marginTop: 12 }}>S3 Config</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <Form.Item label="Endpoint" name="s3Endpoint"><Input /></Form.Item>
          <Form.Item label="AK" name="s3Ak"><Input /></Form.Item>
          <Form.Item label="SK" name="s3Sk"><Input /></Form.Item>
        </div>
        <Collapse ghost items={[{
          key: 'advanced',
          label: 'Advanced Settings',
          children: (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <Form.Item label="Upload Directory" name="uploadDir"><Input placeholder="Leave empty to use global setting" /></Form.Item>
              <Form.Item label="Download Directory" name="downloadDir"><Input placeholder="Leave empty to use global setting" /></Form.Item>
            </div>
          ),
        }]} />
      </Form>
    </Modal>
  );
}
