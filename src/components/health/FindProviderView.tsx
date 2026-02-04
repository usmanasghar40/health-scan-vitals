import React, { useState, useEffect } from 'react';
import { useUser, ProviderWithUser } from '@/contexts/UserContext';
import { Search, Star, MapPin, Clock, Phone, Globe, ChevronRight, Filter, Calendar, Video, Heart, X, Check, Stethoscope } from 'lucide-react';

interface FindProviderViewProps {
  onNavigate: (tab: string) => void;
  onSelectProvider?: (provider: ProviderWithUser) => void;
}

const specialties = [
  'All Specialties',
  'Internal Medicine',
  'Family Medicine',
  'Cardiology',
  'Dermatology',
  'Endocrinology',
  'Psychiatry',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'General Practice'
];

const FindProviderView: React.FC<FindProviderViewProps> = ({ onNavigate, onSelectProvider }) => {
  const { getProviders, isAuthenticated } = useUser();
  const [providers, setProviders] = useState<ProviderWithUser[]>([]);
  const [filteredProviders, setFilteredProviders] = useState<ProviderWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpecialty, setSelectedSpecialty] = useState('All Specialties');
  const [acceptingNewOnly, setAcceptingNewOnly] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderWithUser | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [savedProviders, setSavedProviders] = useState<string[]>([]);

  useEffect(() => {
    loadProviders();
  }, []);

  useEffect(() => {
    filterProviders();
  }, [providers, searchQuery, selectedSpecialty, acceptingNewOnly]);

  const loadProviders = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching providers...');
      const data = await getProviders();
      console.log('Providers received:', data);
      
      // Validate and sanitize provider data
      const validProviders = (data || []).filter(p => {
        // Ensure provider has required fields
        if (!p || !p.id || !p.user) {
          console.warn('Invalid provider data:', p);
          return false;
        }
        // Only show providers who have set up their schedule
        if (!p.has_schedule) {
          console.log('Provider has no schedule:', p.user?.first_name, p.user?.last_name);
          return false;
        }
        return true;
      }).map(p => ({
        ...p,
        // Ensure user object has required fields with defaults
        user: {
          id: p.user?.id || p.user_id || '',
          email: p.user?.email || '',
          first_name: p.user?.first_name || 'Unknown',
          last_name: p.user?.last_name || 'Provider',
          phone: p.user?.phone || ''
        },
        // Ensure numeric fields are numbers
        rating: Number(p.rating) || 0,
        review_count: Number(p.review_count) || 0,
        years_experience: p.years_experience ? Number(p.years_experience) : undefined,
        consultation_fee: p.consultation_fee ? Number(p.consultation_fee) : undefined,
        // Ensure arrays are arrays
        languages: Array.isArray(p.languages) ? p.languages : [],
        // Ensure booleans are booleans
        accepting_new_patients: Boolean(p.accepting_new_patients)
      }));

      
      console.log('Valid providers:', validProviders);
      setProviders(validProviders);
    } catch (err) {
      console.error('Error loading providers:', err);
      setError('Failed to load providers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterProviders = () => {
    let filtered = [...providers];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => {
        const fullName = `${p.user?.first_name || ''} ${p.user?.last_name || ''}`.toLowerCase();
        const specialty = (p.specialty || '').toLowerCase();
        return fullName.includes(query) || specialty.includes(query);
      });
    }

    if (selectedSpecialty !== 'All Specialties') {
      filtered = filtered.filter(p => p.specialty === selectedSpecialty);
    }

    if (acceptingNewOnly) {
      filtered = filtered.filter(p => p.accepting_new_patients);
    }

    setFilteredProviders(filtered);
  };

  const toggleSaveProvider = (providerId: string) => {
    setSavedProviders(prev =>
      prev.includes(providerId)
        ? prev.filter(id => id !== providerId)
        : [...prev, providerId]
    );
  };

  const handleBookAppointment = (provider: ProviderWithUser) => {
    if (onSelectProvider) {
      onSelectProvider(provider);
    }
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = (firstName || 'U')[0] || 'U';
    const last = (lastName || 'P')[0] || 'P';
    return `${first}${last}`.toUpperCase();
  };

  const getDisplayName = (provider: ProviderWithUser) => {
    const firstName = provider.user?.first_name || 'Unknown';
    const lastName = provider.user?.last_name || 'Provider';
    return `Dr. ${firstName} ${lastName}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Find a Provider</h1>
          <p className="text-slate-400 mt-1">Browse our network of healthcare professionals</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 lg:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or specialty..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-3 rounded-xl border transition-colors ${
              showFilters ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'
            }`}
          >
            <Filter className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-in slide-in-from-top-2">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-slate-400 mb-2 block">Specialty</label>
              <select
                value={selectedSpecialty}
                onChange={(e) => setSelectedSpecialty(e.target.value)}
                className="w-full px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                {specialties.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-3 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg cursor-pointer hover:border-slate-600 transition-colors">
                <input
                  type="checkbox"
                  checked={acceptingNewOnly}
                  onChange={(e) => setAcceptingNewOnly(e.target.checked)}
                  className="w-4 h-4 rounded bg-slate-700 border-slate-600 text-cyan-500 focus:ring-cyan-500"
                />
                <span className="text-white text-sm">Accepting new patients only</span>
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 text-rose-400">
          {error}
          <button 
            onClick={loadProviders}
            className="ml-4 underline hover:no-underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Results Count */}
      <div className="flex items-center justify-between">
        <p className="text-slate-400">
          {loading ? 'Loading providers...' : `${filteredProviders.length} provider${filteredProviders.length !== 1 ? 's' : ''} found`}
        </p>
        <button 
          onClick={loadProviders}
          className="text-cyan-400 text-sm hover:underline"
        >
          Refresh
        </button>
      </div>

      {/* Provider Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-xl bg-slate-700" />
                <div className="flex-1 space-y-2">
                  <div className="h-5 bg-slate-700 rounded w-3/4" />
                  <div className="h-4 bg-slate-700 rounded w-1/2" />
                  <div className="h-4 bg-slate-700 rounded w-1/3" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredProviders.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-20 h-20 mx-auto rounded-full bg-slate-800/50 flex items-center justify-center mb-4">
            <Stethoscope className="w-10 h-10 text-slate-600" />
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No providers found</h3>
          <p className="text-slate-400 mb-4">
            {providers.length === 0 
              ? "No healthcare providers have registered yet. Check back soon!"
              : "Try adjusting your search or filters"
            }
          </p>
          {providers.length > 0 && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedSpecialty('All Specialties');
                setAcceptingNewOnly(false);
              }}
              className="px-4 py-2 bg-cyan-500/20 text-cyan-400 rounded-lg hover:bg-cyan-500/30 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProviders.map(provider => (
            <div
              key={provider.id}
              className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden hover:border-cyan-500/50 transition-all group"
            >
              {/* Provider Image */}
              <div className="relative h-48 bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
                {provider.profile_image ? (
                  <img
                    src={provider.profile_image}
                    alt={getDisplayName(provider)}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-3xl font-bold">
                      {getInitials(provider.user?.first_name, provider.user?.last_name)}
                    </div>
                  </div>
                )}
                <button
                  onClick={() => toggleSaveProvider(provider.id)}
                  className="absolute top-3 right-3 p-2 rounded-full bg-slate-900/70 backdrop-blur-sm hover:bg-slate-900 transition-colors"
                >
                  <Heart
                    className={`w-5 h-5 ${
                      savedProviders.includes(provider.id)
                        ? 'fill-rose-500 text-rose-500'
                        : 'text-white'
                    }`}
                  />
                </button>
                {provider.accepting_new_patients && (
                  <div className="absolute bottom-3 left-3 px-3 py-1 bg-emerald-500/90 backdrop-blur-sm rounded-full text-xs font-medium text-white flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Accepting Patients
                  </div>
                )}
              </div>

              {/* Provider Info */}
              <div className="p-5">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-400 transition-colors">
                    {getDisplayName(provider)}
                  </h3>
                  <p className="text-cyan-400 text-sm">{provider.specialty || 'General Practice'}</p>
                  {provider.credentials && (
                    <p className="text-slate-500 text-sm">{provider.credentials}</p>
                  )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span className="text-white font-medium">{(Number(provider.rating) || 0).toFixed(1)}</span>
                  </div>
                  <span className="text-slate-500 text-sm">({Number(provider.review_count) || 0} reviews)</span>
                </div>


                {/* Details */}
                <div className="space-y-2 mb-4">
                  {provider.years_experience && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{provider.years_experience} years experience</span>
                    </div>
                  )}
                  {provider.languages && provider.languages.length > 0 && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Globe className="w-4 h-4" />
                      <span>{provider.languages.join(', ')}</span>
                    </div>
                  )}
                  {provider.consultation_fee && (
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <span className="w-4 h-4 flex items-center justify-center font-bold">$</span>
                      <span>${provider.consultation_fee} per visit</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedProvider(provider)}
                    className="flex-1 px-4 py-2 bg-slate-700/50 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-sm"
                  >
                    View Profile
                  </button>
                  <button
                    onClick={() => handleBookAppointment(provider)}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 transition-all text-sm flex items-center justify-center gap-2"
                  >
                    <Calendar className="w-4 h-4" />
                    Book
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="relative h-64 bg-gradient-to-br from-cyan-500/20 to-blue-600/20">
              {selectedProvider.profile_image ? (
                <img
                  src={selectedProvider.profile_image}
                  alt={getDisplayName(selectedProvider)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-32 h-32 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-5xl font-bold">
                    {getInitials(selectedProvider.user?.first_name, selectedProvider.user?.last_name)}
                  </div>
                </div>
              )}
              <button
                onClick={() => setSelectedProvider(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/70 backdrop-blur-sm hover:bg-slate-900 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {getDisplayName(selectedProvider)}
                  </h2>
                  <p className="text-cyan-400">{selectedProvider.specialty || 'General Practice'}</p>
                  {selectedProvider.credentials && (
                    <p className="text-slate-500">{selectedProvider.credentials}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-slate-800 rounded-lg">
                  <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
                  <span className="text-white font-semibold">{(Number(selectedProvider.rating) || 0).toFixed(1)}</span>
                  <span className="text-slate-500">({Number(selectedProvider.review_count) || 0})</span>
                </div>

              </div>

              {selectedProvider.bio && (
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2">About</h3>
                  <p className="text-slate-400 leading-relaxed">{selectedProvider.bio}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                {selectedProvider.years_experience && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Experience</p>
                    <p className="text-white font-semibold">{selectedProvider.years_experience} years</p>
                  </div>
                )}
                {selectedProvider.consultation_fee && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Consultation Fee</p>
                    <p className="text-white font-semibold">${selectedProvider.consultation_fee}</p>
                  </div>
                )}
                {selectedProvider.languages && selectedProvider.languages.length > 0 && (
                  <div className="bg-slate-800/50 rounded-lg p-4">
                    <p className="text-slate-500 text-sm">Languages</p>
                    <p className="text-white font-semibold">{selectedProvider.languages.join(', ')}</p>
                  </div>
                )}
                <div className="bg-slate-800/50 rounded-lg p-4">
                  <p className="text-slate-500 text-sm">Accepting New Patients</p>
                  <p className={`font-semibold ${selectedProvider.accepting_new_patients ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedProvider.accepting_new_patients ? 'Yes' : 'No'}
                  </p>
                </div>
              </div>

              {selectedProvider.user?.phone && (
                <div className="flex items-center gap-3 p-4 bg-slate-800/50 rounded-lg mb-6">
                  <Phone className="w-5 h-5 text-cyan-400" />
                  <span className="text-white">{selectedProvider.user.phone}</span>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedProvider(null)}
                  className="flex-1 px-6 py-3 bg-slate-700/50 text-slate-300 rounded-xl hover:bg-slate-700 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handleBookAppointment(selectedProvider);
                    setSelectedProvider(null);
                  }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:from-cyan-600 hover:to-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Calendar className="w-5 h-5" />
                  Book Appointment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindProviderView;
