'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ShieldCheck,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertCircle,
  ExternalLink,
  MapPin,
  Calendar,
  CreditCard,
  User as UserIcon,
  Fingerprint,
  ChevronRight,
} from 'lucide-react';
import Link from 'next/link';
import { kycRequester } from '@/lib/requesters';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { format } from 'date-fns';
import Swal from 'sweetalert2';

interface KycDetails {
  user: {
    id: string;
    email: string | null;
    phoneNumber: string;
  } | null;
  kycData: {
    idCardNumberEncrypted: string | null;
    idCardName: string | null;
    prefix: string | null;
    firstNameTh: string | null;
    lastNameTh: string | null;
    prefixEn: string | null;
    firstNameEn: string | null;
    lastNameEn: string | null;
    dateOfBirth: string | null;
    idCardIssueDate: string | null;
    idCardExpiryDate: string | null;
    religion: string | null;
    idCardImageUrl: string | null;
    selfieImageUrl: string | null;
    faceMatchScore: number | null;
    ocrConfidence: number | null;
    verificationStatus: string;
    verifiedAt: string | null;
    reviewNote: string | null;
    createdAt: string;
  } | null;
  documents: any[];
  addresses: any[];
  profile: {
    occupation: string | null;
    incomeRange: string | null;
    sourceOfFunds: string | null;
    purposeOfAccount: string | null;
  } | null;
  history: any[];
}

export default function KycDetailPage() {
  const { userId } = useParams();
  const router = useRouter();
  const [details, setDetails] = useState<KycDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await kycRequester.getDetails(userId as string);
        setDetails(data);
      } catch (err) {
        console.error('Failed to fetch KYC details:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDetails();
  }, [userId]);

  const handleApprove = async () => {
    const result = await Swal.fire({
      title: 'Approve KYC?',
      text: 'This will activate the user wallet and complete registration.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Approve',
      confirmButtonColor: '#10B981',
    });

    if (result.isConfirmed) {
      try {
        await kycRequester.approve(userId as string);
        Swal.fire('Approved!', 'User identity has been verified.', 'success');
        router.push('/kyc');
      } catch (err) {
        Swal.fire('Error', 'Failed to approve KYC', 'error');
      }
    }
  };

  const handleReject = async () => {
    const { value: reason } = await Swal.fire({
      title: 'Reject KYC',
      input: 'textarea',
      inputLabel: 'Reason for rejection',
      inputPlaceholder: 'e.g. ID card image is too blurry...',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
    });

    if (reason) {
      try {
        await kycRequester.reject(userId as string, reason);
        Swal.fire('Rejected', 'User has been notified.', 'info');
        router.push('/kyc');
      } catch (err) {
        Swal.fire('Error', 'Failed to reject KYC', 'error');
      }
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading KYC Details...</div>;
  if (!details || !details.kycData)
    return <div className="p-8 text-center text-red-500">KYC Data not found</div>;

  const { kycData, user } = details;

  return (
    <div className="space-y-6 pb-20">
      {/* Header with Breadcrumbs */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest gap-2">
          <button
            onClick={() => router.back()}
            className="hover:text-indigo-600 transition-colors uppercase tracking-widest font-bold text-[10px]"
          >
            KYC Verification
          </button>
          <ChevronRight className="w-3 h-3" />
          <span className="text-slate-900">Verification Details</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Verification Detail
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs text-slate-500 font-medium">
                Reviewing identity for{' '}
                <span className="font-bold text-slate-700">{user?.email || user?.phoneNumber}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Row: Actions & Images */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <Card className="border-none shadow-lg shadow-indigo-100 ring-1 ring-indigo-50 overflow-hidden">
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-slate-800">Final Decision</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Please verify that the ID card belongs to the user in the selfie and that all data
              matches the government records.
            </p>

            {kycData.verificationStatus === 'PENDING' ? (
              <div className="space-y-3 pt-4">
                <Button
                  onClick={handleApprove}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-12 shadow-md shadow-emerald-100"
                >
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Approve Verification
                </Button>
                <Button
                  onClick={handleReject}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50 font-bold h-12"
                >
                  <XCircle className="w-5 h-5 mr-2" />
                  Reject Request
                </Button>
              </div>
            ) : (
              <div className="pt-6 text-center space-y-4">
                {kycData.verificationStatus === 'APPROVED' ? (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl border border-emerald-100 space-y-2">
                    <div className="flex items-center justify-center gap-2 font-black text-sm uppercase">
                      <CheckCircle2 className="w-5 h-5" />
                      Verified Successfully
                    </div>
                    <p className="text-[10px] opacity-70">
                      This verification was approved on{' '}
                      {kycData.verifiedAt
                        ? format(new Date(kycData.verifiedAt), 'dd MMMM yyyy HH:mm')
                        : format(new Date(), 'dd MMMM yyyy')}
                    </p>
                  </div>
                ) : (
                  <div className="bg-rose-50 text-rose-700 p-4 rounded-xl border border-rose-100 space-y-2">
                    <div className="flex items-center justify-center gap-2 font-black text-sm uppercase">
                      <XCircle className="w-5 h-5" />
                      Verification Rejected
                    </div>
                    {kycData.reviewNote && (
                      <p className="text-xs font-medium italic border-t border-rose-100 pt-2 mt-2">
                        "{kycData.reviewNote}"
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="bg-slate-50 p-4 border-t border-slate-100 text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Action will be logged in audit trail
            </span>
          </div>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="bg-slate-50/50 py-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-500" />
              ID Card Document
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-[3/2] bg-slate-100 relative group">
              {kycData.idCardImageUrl ? (
                <img
                  src={kycData.idCardImageUrl}
                  alt="ID Card"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <AlertCircle className="w-12 h-12 mb-2" />
                  <span>No ID image</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <a
                  href={kycData.idCardImageUrl || '#'}
                  target="_blank"
                  className="bg-white text-slate-900 px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2"
                >
                  <ExternalLink className="w-3 h-3" />
                  Open Original
                </a>
              </div>
            </div>
            <div className="p-4 bg-indigo-50/30 flex justify-between items-center border-t border-indigo-50">
              <span className="text-xs font-bold text-indigo-700">OCR CONFIDENCE</span>
              <Badge className="bg-indigo-500">{(kycData.ocrConfidence || 0) * 100}%</Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden border-none shadow-sm ring-1 ring-slate-100">
          <CardHeader className="bg-slate-50/50 py-3">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-pink-500" />
              Selfie / Liveness
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-[3/2] bg-slate-100 relative group">
              {kycData.selfieImageUrl ? (
                <img
                  src={kycData.selfieImageUrl}
                  alt="Selfie"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <Fingerprint className="w-12 h-12 mb-2" />
                  <span>No Selfie image</span>
                </div>
              )}
            </div>
            <div className="p-4 bg-pink-50/30 flex justify-between items-center border-t border-pink-50">
              <span className="text-xs font-bold text-pink-700">FACE MATCH SCORE</span>
              <Badge
                className={`bg-pink-500 ${(kycData.faceMatchScore || 0) < 80 ? 'bg-red-500' : ''}`}
              >
                {kycData.faceMatchScore || 0}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Middle Row: Identity Data */}
      <Card className="border-none shadow-sm ring-1 ring-slate-100">
        <CardHeader className="border-b border-slate-50 bg-white">
          <CardTitle className="text-lg flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-500" />
            Extracted Identity Data
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Personal Information (TH)
              </label>
              <div className="space-y-3">
                <InfoRow label="Prefix" value={kycData.prefix || 'N/A'} icon={UserIcon} />
                <InfoRow
                  label="First Name (TH)"
                  value={kycData.firstNameTh || 'N/A'}
                  icon={UserIcon}
                />
                <InfoRow
                  label="Last Name (TH)"
                  value={kycData.lastNameTh || 'N/A'}
                  icon={UserIcon}
                />
                <InfoRow
                  label="Date of Birth"
                  value={
                    kycData.dateOfBirth
                      ? format(new Date(kycData.dateOfBirth), 'dd MMMM yyyy')
                      : 'N/A'
                  }
                  icon={Calendar}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Personal Information (EN)
              </label>
              <div className="space-y-3">
                <InfoRow label="Prefix (EN)" value={kycData.prefixEn || 'N/A'} icon={UserIcon} />
                <InfoRow
                  label="First Name (EN)"
                  value={kycData.firstNameEn || 'N/A'}
                  icon={UserIcon}
                />
                <InfoRow
                  label="Last Name (EN)"
                  value={kycData.lastNameEn || 'N/A'}
                  icon={UserIcon}
                />
                <InfoRow label="Religion" value={kycData.religion || 'N/A'} icon={ShieldCheck} />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Document Metadata
              </label>
              <div className="space-y-3">
                <InfoRow
                  label="ID Number"
                  value={kycData.idCardNumberEncrypted || 'N/A'}
                  icon={CreditCard}
                />
                <InfoRow
                  label="Issue Date"
                  value={
                    kycData.idCardIssueDate
                      ? format(new Date(kycData.idCardIssueDate), 'dd MMMM yyyy')
                      : 'N/A'
                  }
                  icon={Calendar}
                />
                <InfoRow
                  label="Expiry Date"
                  value={
                    kycData.idCardExpiryDate
                      ? format(new Date(kycData.idCardExpiryDate), 'dd MMMM yyyy')
                      : 'N/A'
                  }
                  icon={Calendar}
                />
              </div>
            </div>
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                Verification Status
              </label>
              <div className="space-y-3">
                <InfoRow
                  label="Status"
                  value={kycData.verificationStatus}
                  icon={ShieldCheck}
                  status={kycData.verificationStatus}
                />
                <InfoRow
                  label="Submitted At"
                  value={format(new Date(kycData.createdAt), 'dd MMM yyyy HH:mm')}
                  icon={Calendar}
                />
                <InfoRow
                  label="Review Note"
                  value={kycData.reviewNote || 'No notes provided'}
                  icon={AlertCircle}
                />
              </div>
            </div>
          </div>

          {/* Profile & Address Section */}
          <div className="mt-8 pt-8 border-t border-slate-50 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Professional Profile
              </label>
              {details.profile ? (
                <div className="space-y-3">
                  <InfoRow
                    label="Occupation"
                    value={details.profile.occupation || 'N/A'}
                    icon={ShieldCheck}
                  />
                  <InfoRow
                    label="Income Range"
                    value={details.profile.incomeRange || 'N/A'}
                    icon={ShieldCheck}
                  />
                  <InfoRow
                    label="Source of Funds"
                    value={details.profile.sourceOfFunds || 'N/A'}
                    icon={ShieldCheck}
                  />
                  <InfoRow
                    label="Account Purpose"
                    value={details.profile.purposeOfAccount || 'N/A'}
                    icon={ShieldCheck}
                  />
                </div>
              ) : (
                <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 italic text-slate-400 text-sm">
                  No profile information provided
                </div>
              )}
            </div>

            <div className="space-y-4">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400 block">
                Addresses
              </label>
              <div className="space-y-3">
                {details.addresses && details.addresses.length > 0 ? (
                  details.addresses.map((addr, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50/50 rounded-lg border border-slate-100"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`text-[9px] uppercase font-black px-1.5 py-0.5 rounded ${
                            addr.type === 'REGISTERED'
                              ? 'text-emerald-600 bg-emerald-50'
                              : addr.type === 'CURRENT'
                                ? 'text-blue-600 bg-blue-50'
                                : 'text-indigo-500 bg-indigo-50'
                          }`}
                        >
                          {addr.type}
                        </span>
                        {addr.label && (
                          <span className="text-[10px] text-slate-400 font-medium">
                            ({addr.label})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-700 font-medium">{addr.line1}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        {addr.subdistrict ? `${addr.subdistrict}, ` : ''}
                        {addr.district ? `${addr.district}, ` : ''}
                        {addr.province ? `${addr.province} ` : ''}
                        {addr.postalCode || ''}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 bg-slate-50/50 rounded-xl border border-slate-100 italic text-slate-400 text-sm">
                    No address information recorded
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bottom Row: Review History */}
      {details.history && details.history.length > 0 && (
        <Card className="border-none shadow-sm ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50/50 py-3 border-b border-slate-100">
            <CardTitle className="text-sm font-bold flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-500" />
              Review History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4">
            <div className="space-y-4">
              {details.history.map((log: any, idx: number) => (
                <div key={log.id} className="relative pl-6 pb-2 last:pb-0">
                  {/* Timeline Line */}
                  {idx !== details.history.length - 1 && (
                    <div className="absolute left-[7px] top-[18px] bottom-0 w-[2px] bg-slate-100" />
                  )}
                  {/* Timeline Dot */}
                  <div className="absolute left-0 top-1 w-4 h-4 rounded-full border-2 border-white bg-indigo-500 shadow-sm" />

                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <p className="text-xs font-bold text-slate-700">
                        {log.adminUser?.firstName} {log.adminUser?.lastName}
                      </p>
                      <span className="text-[9px] text-slate-400 font-medium">
                        {format(new Date(log.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {log.reason || 'No description provided'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, status }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-1">
        <Icon className="w-4 h-4 text-slate-400" />
      </div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{label}</p>
        <p
          className={`text-sm font-semibold ${status === 'APPROVED' ? 'text-emerald-600' : status === 'REJECTED' ? 'text-red-600' : 'text-slate-700'}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
