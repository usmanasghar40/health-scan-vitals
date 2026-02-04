import React from 'react';
import { Scan, Activity, MessageCircle, ArrowRight, Shield, Heart, Lock, Search, Calendar, Stethoscope } from 'lucide-react';

interface HeroSectionProps {
  onStartScan: () => void;
  onOpenChat: () => void;
}

const HeroSection: React.FC<HeroSectionProps> = ({ onStartScan, onOpenChat }) => {
  const features = [
    {
      icon: Search,
      title: 'Find Providers',
      description: 'Browse our network of healthcare professionals'
    },
    {
      icon: Calendar,
      title: 'Easy Booking',
      description: 'Schedule appointments online in minutes'
    },
    {
      icon: Heart,
      title: 'Heart Scan',
      description: 'Measure heart rate and HRV with your phone'
    },
    {
      icon: Stethoscope,
      title: 'Telehealth',
      description: 'Connect with providers from anywhere'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-slate-900 to-purple-500/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
      </div>

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Column */}
          <div>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
                <Shield className="w-4 h-4 text-cyan-400" />
                <span className="text-sm text-cyan-400 font-medium">Trusted Healthcare Platform</span>
              </div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-full">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span className="text-sm text-emerald-400 font-medium">HIPAA Compliant</span>
              </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Your Health,
              <span className="block bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                Your Control
              </span>
            </h1>

            <p className="text-lg text-slate-300 mb-8 leading-relaxed">
              Find trusted healthcare providers, book appointments instantly, and manage your 
              health data all in one secure platform. Take charge of your wellness journey today.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={onStartScan}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-semibold hover:from-cyan-600 hover:to-blue-700 transition-all duration-300 shadow-lg shadow-cyan-500/25"
              >
                <Search className="w-5 h-5" />
                Find a Provider
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={onOpenChat}
                className="flex items-center gap-2 px-6 py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-700 transition-all duration-300 border border-slate-700"
              >
                <MessageCircle className="w-5 h-5" />
                Ask AI Assistant
              </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mt-12">
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">500+</div>
                <div className="text-xs md:text-sm text-slate-400">Providers</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">50k+</div>
                <div className="text-xs md:text-sm text-slate-400">Patients</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">4.9</div>
                <div className="text-xs md:text-sm text-slate-400">Avg Rating</div>
              </div>
              <div>
                <div className="text-2xl md:text-3xl font-bold text-white">24/7</div>
                <div className="text-xs md:text-sm text-slate-400">Support</div>
              </div>
            </div>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="grid grid-cols-2 gap-4">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-5 hover:border-cyan-500/50 hover:bg-slate-800/70 transition-all duration-300 group cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center mb-4 group-hover:from-cyan-500/30 group-hover:to-blue-500/30 transition-all">
                    <Icon className="w-6 h-6 text-cyan-400" />
                  </div>
                  <h3 className="text-white font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Animated Elements */}
      <div className="absolute top-20 right-20 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
    </div>
  );
};

export default HeroSection;
