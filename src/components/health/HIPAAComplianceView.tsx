import React, { useState } from 'react';
import { 
  Shield, Lock, Eye, EyeOff, FileText, Download, Trash2,
  CheckCircle, AlertCircle, Clock, User, Key, Smartphone,
  Globe, Server, Database, RefreshCw, ChevronRight, Settings,
  Bell, Mail, Phone, Building2, ClipboardList, History
} from 'lucide-react';
import { HIPAAConsent, AuditLogEntry, PrivacySettings, DataExportRequest } from '@/types/health';

const HIPAAComplianceView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'privacy' | 'consent' | 'audit' | 'export'>('overview');
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>({
    dataRetentionDays: 365,
    autoDeleteEnabled: false,
    encryptionEnabled: true,
    twoFactorEnabled: false,
    shareWithProviders: true,
    anonymousAnalytics: false
  });

  const [consents, setConsents] = useState<HIPAAConsent[]>([
    {
      id: '1',
      consentType: 'data_collection',
      granted: true,
      grantedDate: new Date('2025-01-01'),
      description: 'Allow collection and storage of health data for analysis and recommendations'
    },
    {
      id: '2',
      consentType: 'data_sharing',
      granted: true,
      grantedDate: new Date('2025-01-01'),
      description: 'Allow sharing of health data with connected healthcare providers'
    },
    {
      id: '3',
      consentType: 'research',
      granted: false,
      description: 'Allow anonymized data to be used for medical research purposes'
    },
    {
      id: '4',
      consentType: 'marketing',
      granted: false,
      description: 'Receive health-related product and service recommendations'
    }
  ]);

  const [auditLogs] = useState<AuditLogEntry[]>([
    { id: '1', timestamp: new Date(), action: 'view', resource: 'Lab Results - CBC Panel', userId: 'user123', ipAddress: '192.168.1.1' },
    { id: '2', timestamp: new Date(Date.now() - 3600000), action: 'export', resource: 'Health Summary Report', userId: 'user123', ipAddress: '192.168.1.1' },
    { id: '3', timestamp: new Date(Date.now() - 7200000), action: 'import', resource: 'LabCorp Results', userId: 'user123', ipAddress: '192.168.1.1' },
    { id: '4', timestamp: new Date(Date.now() - 86400000), action: 'share', resource: 'Cardiovascular Panel', userId: 'user123', ipAddress: '192.168.1.1', details: 'Shared with Dr. Smith' },
    { id: '5', timestamp: new Date(Date.now() - 172800000), action: 'update', resource: 'Privacy Settings', userId: 'user123', ipAddress: '192.168.1.1' },
  ]);

  const [exportRequests] = useState<DataExportRequest[]>([
    { id: '1', requestDate: new Date(Date.now() - 86400000), status: 'ready', format: 'pdf', downloadUrl: '#', expirationDate: new Date(Date.now() + 604800000) },
    { id: '2', requestDate: new Date(Date.now() - 604800000), status: 'expired', format: 'fhir' },
  ]);

  const toggleConsent = (id: string) => {
    setConsents(prev => prev.map(c => 
      c.id === id ? { ...c, granted: !c.granted, grantedDate: !c.granted ? new Date() : undefined } : c
    ));
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Shield },
    { id: 'privacy', label: 'Privacy Settings', icon: Lock },
    { id: 'consent', label: 'Consent Management', icon: ClipboardList },
    { id: 'audit', label: 'Audit Log', icon: History },
    { id: 'export', label: 'Data Export', icon: Download },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            HIPAA Compliance & Privacy
          </h2>
          <p className="text-slate-400 mt-1">
            Manage your privacy settings, consents, and view access logs
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span className="text-sm text-emerald-400 font-medium">HIPAA Compliant</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-800/50 p-2 rounded-xl">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Compliance Status */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-xl p-6 border border-emerald-500/30">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-emerald-400 font-semibold">HIPAA Compliant</p>
                  <p className="text-slate-400 text-sm">All requirements met</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Your data is protected according to HIPAA Privacy and Security Rules
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                  <Lock className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">AES-256 Encryption</p>
                  <p className="text-slate-400 text-sm">Data at rest & in transit</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Military-grade encryption protects all your health information
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <Server className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-white font-semibold">SOC 2 Type II</p>
                  <p className="text-slate-400 text-sm">Certified infrastructure</p>
                </div>
              </div>
              <p className="text-slate-400 text-sm">
                Our systems meet rigorous security and availability standards
              </p>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Security Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: Lock, title: 'End-to-End Encryption', desc: 'All data encrypted using AES-256' },
                { icon: Key, title: 'Access Controls', desc: 'Role-based access with audit trails' },
                { icon: Smartphone, title: 'Multi-Factor Auth', desc: 'Optional 2FA for enhanced security' },
                { icon: Database, title: 'Secure Storage', desc: 'HIPAA-compliant cloud infrastructure' },
                { icon: Globe, title: 'Secure Transmission', desc: 'TLS 1.3 for all data transfers' },
                { icon: RefreshCw, title: 'Regular Backups', desc: 'Encrypted backups with 99.99% uptime' },
              ].map((feature, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <feature.icon className="w-5 h-5 text-cyan-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">{feature.title}</p>
                    <p className="text-slate-400 text-sm">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Your Rights */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Your HIPAA Rights</h3>
            <div className="space-y-3">
              {[
                'Right to access your health information',
                'Right to request corrections to your records',
                'Right to know who has accessed your information',
                'Right to request restrictions on data use',
                'Right to receive a copy of your data in electronic format',
                'Right to be notified of any data breaches',
              ].map((right, index) => (
                <div key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  <span className="text-slate-300">{right}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Privacy Settings Tab */}
      {activeTab === 'privacy' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Privacy Controls</h3>
            <div className="space-y-6">
              {/* Data Retention */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-700/50">
                <div>
                  <p className="text-white font-medium">Data Retention Period</p>
                  <p className="text-slate-400 text-sm">How long to keep your health data</p>
                </div>
                <select
                  value={privacySettings.dataRetentionDays}
                  onChange={(e) => setPrivacySettings(prev => ({ ...prev, dataRetentionDays: Number(e.target.value) }))}
                  className="px-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                  <option value={365}>1 year</option>
                  <option value={730}>2 years</option>
                  <option value={1825}>5 years</option>
                  <option value={-1}>Indefinitely</option>
                </select>
              </div>

              {/* Toggle Settings */}
              {[
                { key: 'encryptionEnabled', title: 'Data Encryption', desc: 'Encrypt all stored health data (recommended)', locked: true },
                { key: 'twoFactorEnabled', title: 'Two-Factor Authentication', desc: 'Require 2FA for account access' },
                { key: 'shareWithProviders', title: 'Share with Healthcare Providers', desc: 'Allow connected providers to access your data' },
                { key: 'autoDeleteEnabled', title: 'Auto-Delete Old Data', desc: 'Automatically delete data after retention period' },
                { key: 'anonymousAnalytics', title: 'Anonymous Analytics', desc: 'Help improve the app with anonymized usage data' },
              ].map((setting) => (
                <div key={setting.key} className="flex items-center justify-between pb-4 border-b border-slate-700/50 last:border-0">
                  <div>
                    <p className="text-white font-medium flex items-center gap-2">
                      {setting.title}
                      {setting.locked && <Lock className="w-4 h-4 text-slate-500" />}
                    </p>
                    <p className="text-slate-400 text-sm">{setting.desc}</p>
                  </div>
                  <button
                    onClick={() => !setting.locked && setPrivacySettings(prev => ({ ...prev, [setting.key]: !prev[setting.key as keyof PrivacySettings] }))}
                    disabled={setting.locked}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      privacySettings[setting.key as keyof PrivacySettings]
                        ? 'bg-cyan-500'
                        : 'bg-slate-600'
                    } ${setting.locked ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      privacySettings[setting.key as keyof PrivacySettings] ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-red-500/5 rounded-xl p-6 border border-red-500/30">
            <h3 className="text-lg font-semibold text-red-400 mb-4">Danger Zone</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Delete All Health Data</p>
                  <p className="text-slate-400 text-sm">Permanently remove all your health records</p>
                </div>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  Delete All Data
                </button>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">Close Account</p>
                  <p className="text-slate-400 text-sm">Delete your account and all associated data</p>
                </div>
                <button className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors">
                  Close Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Consent Management Tab */}
      {activeTab === 'consent' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-6">Manage Your Consents</h3>
            <div className="space-y-4">
              {consents.map((consent) => (
                <div key={consent.id} className="flex items-start justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex-1">
                    <p className="text-white font-medium capitalize">
                      {consent.consentType.replace('_', ' ')}
                    </p>
                    <p className="text-slate-400 text-sm mt-1">{consent.description}</p>
                    {consent.granted && consent.grantedDate && (
                      <p className="text-slate-500 text-xs mt-2">
                        Granted on {consent.grantedDate.toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleConsent(consent.id)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      consent.granted ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}
                  >
                    <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      consent.granted ? 'translate-x-7' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Business Associate Agreements */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Business Associate Agreements</h3>
            <p className="text-slate-400 text-sm mb-4">
              We maintain Business Associate Agreements (BAAs) with all third-party services 
              that may access your protected health information.
            </p>
            <div className="space-y-3">
              {[
                { name: 'Cloud Infrastructure Provider', status: 'Active', date: '2025-01-01' },
                { name: 'EHR Integration Partners', status: 'Active', date: '2025-01-01' },
                { name: 'Laboratory Data Services', status: 'Active', date: '2025-01-01' },
              ].map((baa, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-slate-400" />
                    <span className="text-white">{baa.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 text-sm">{baa.status}</span>
                    <span className="text-slate-500 text-sm">Since {baa.date}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log Tab */}
      {activeTab === 'audit' && (
        <div className="space-y-6">
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Access History</h3>
              <button className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm">
                <Download className="w-4 h-4" />
                Export Log
              </button>
            </div>
            <div className="space-y-3">
              {auditLogs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      log.action === 'view' ? 'bg-blue-500/20' :
                      log.action === 'export' ? 'bg-purple-500/20' :
                      log.action === 'import' ? 'bg-emerald-500/20' :
                      log.action === 'share' ? 'bg-amber-500/20' :
                      'bg-slate-500/20'
                    }`}>
                      {log.action === 'view' && <Eye className="w-5 h-5 text-blue-400" />}
                      {log.action === 'export' && <Download className="w-5 h-5 text-purple-400" />}
                      {log.action === 'import' && <FileText className="w-5 h-5 text-emerald-400" />}
                      {log.action === 'share' && <User className="w-5 h-5 text-amber-400" />}
                      {log.action === 'update' && <Settings className="w-5 h-5 text-slate-400" />}
                      {log.action === 'delete' && <Trash2 className="w-5 h-5 text-red-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium capitalize">{log.action} - {log.resource}</p>
                      {log.details && <p className="text-slate-400 text-sm">{log.details}</p>}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-slate-300 text-sm">{log.timestamp.toLocaleString()}</p>
                    <p className="text-slate-500 text-xs">{log.ipAddress}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Export Tab */}
      {activeTab === 'export' && (
        <div className="space-y-6">
          {/* Request New Export */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Request Data Export</h3>
            <p className="text-slate-400 text-sm mb-6">
              Download a complete copy of your health data in your preferred format. 
              This is your right under HIPAA regulations.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { format: 'PDF', desc: 'Human-readable report' },
                { format: 'FHIR', desc: 'Healthcare standard' },
                { format: 'JSON', desc: 'Machine-readable' },
                { format: 'CSV', desc: 'Spreadsheet format' },
              ].map((option) => (
                <button
                  key={option.format}
                  className="p-4 bg-slate-700/50 rounded-lg hover:bg-slate-700 transition-colors text-left"
                >
                  <p className="text-white font-medium">{option.format}</p>
                  <p className="text-slate-400 text-xs">{option.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Previous Exports */}
          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
            <h3 className="text-lg font-semibold text-white mb-4">Previous Exports</h3>
            <div className="space-y-3">
              {exportRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      request.status === 'ready' ? 'bg-emerald-500/20' :
                      request.status === 'processing' ? 'bg-amber-500/20' :
                      'bg-slate-500/20'
                    }`}>
                      {request.status === 'ready' && <CheckCircle className="w-5 h-5 text-emerald-400" />}
                      {request.status === 'processing' && <Clock className="w-5 h-5 text-amber-400" />}
                      {request.status === 'expired' && <AlertCircle className="w-5 h-5 text-slate-400" />}
                    </div>
                    <div>
                      <p className="text-white font-medium">{request.format.toUpperCase()} Export</p>
                      <p className="text-slate-400 text-sm">
                        Requested {request.requestDate.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      request.status === 'ready' ? 'bg-emerald-500/20 text-emerald-400' :
                      request.status === 'processing' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-slate-500/20 text-slate-400'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                    {request.status === 'ready' && (
                      <button className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors text-sm">
                        Download
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HIPAAComplianceView;
