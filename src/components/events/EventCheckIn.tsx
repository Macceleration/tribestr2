import { useState, useEffect } from "react";
import type { NostrEvent } from "@nostrify/nostrify";
import { useEventAttendance } from "@/hooks/useEvents";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
// import { Badge } from "@/components/ui/badge";
import QRCode from "qrcode";
import { RefreshCw, QrCode, Users, CheckCircle } from "lucide-react";

interface EventCheckInProps {
  eventId: string;
  event: NostrEvent;
}

export function EventCheckIn({ eventId, event }: EventCheckInProps) {
  const { data: attendanceRecords } = useEventAttendance(eventId);
  const [_qrCodeData, setQrCodeData] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [lastGenerated, setLastGenerated] = useState<Date | null>(null);

  // Generate new QR code with rotating nonce (13 digit number)
  const generateQRCode = async () => {
    // Generate 13-digit number: timestamp (10 digits) + random (3 digits)
    const timestamp = Math.floor(Date.now() / 1000); // 10 digits
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digits
    const nonce = `${timestamp}${random}`;

    try {
      const url = await QRCode.toDataURL(nonce, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });

      setQrCodeData(nonce);
      setQrCodeUrl(url);
      setLastGenerated(new Date());
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  // Auto-refresh QR code every 30 seconds
  useEffect(() => {
    const generateCode = async () => {
      // Generate 13-digit number: timestamp (10 digits) + random (3 digits)
      const timestamp = Math.floor(Date.now() / 1000); // 10 digits
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // 3 digits
      const nonce = `${timestamp}${random}`;

      try {
        const url = await QRCode.toDataURL(nonce, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#ffffff',
          },
        });

        setQrCodeData(nonce);
        setQrCodeUrl(url);
        setLastGenerated(new Date());
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    };

    generateCode();

    const interval = setInterval(generateCode, 30000);
    return () => clearInterval(interval);
  }, [eventId]);

  // Get unique attendees
  const uniqueAttendees = new Set(
    attendanceRecords?.map(record => record.pubkey) || []
  );

  const _eventTitle = event.tags.find(([name]) => name === 'title')?.[1] || 'Event';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* QR Code Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Check-In QR Code
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-4">
            <div className="text-sm text-muted-foreground">
              Show this QR code to attendees for check-in
            </div>

            {qrCodeUrl && (
              <div className="flex justify-center">
                <div className="p-4 bg-white rounded-lg shadow-sm border">
                  <img
                    src={qrCodeUrl}
                    alt="Check-in QR Code"
                    className="w-64 h-64"
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              {_qrCodeData && (
                <div className="p-3 bg-muted rounded-lg">
                  <div className="text-xs text-muted-foreground mb-1">Current Code:</div>
                  <div className="font-mono text-lg font-bold text-center">
                    {_qrCodeData}
                  </div>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {lastGenerated && (
                  <>Generated at {lastGenerated.toLocaleTimeString()}</>
                )}
              </div>
              <Button
                onClick={generateQRCode}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Refresh Code
              </Button>
            </div>
          </div>

          <div className="p-4 bg-muted rounded-lg">
            <h4 className="font-semibold mb-2">Instructions:</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
              <li>Attendees scan this 13-digit QR code with any QR scanner</li>
              <li>They enter the number in their Nostr client to check-in</li>
              <li>This publishes an attendance verification event</li>
              <li>Badges are automatically awarded after verification</li>
              <li>QR code refreshes every 30 seconds for security</li>
            </ol>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Attendance Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {uniqueAttendees.size}
              </div>
              <div className="text-sm text-muted-foreground">
                Checked In
              </div>
            </div>

            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">
                {attendanceRecords?.length || 0}
              </div>
              <div className="text-sm text-muted-foreground">
                Total Scans
              </div>
            </div>
          </div>

          {/* Recent Check-ins */}
          {attendanceRecords && attendanceRecords.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold">Recent Check-ins</h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {attendanceRecords
                  .sort((a, b) => b.created_at - a.created_at)
                  .slice(0, 10)
                  .map((record) => {
                    const verifiedAt = record.tags.find(([name]) => name === 'verified_at')?.[1];
                    const _location = record.tags.find(([name]) => name === 'location')?.[1];

                    return (
                      <div key={record.id} className="flex items-center justify-between p-2 bg-muted rounded">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">
                            {record.pubkey.slice(0, 8)}...
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {verifiedAt ?
                            new Date(parseInt(verifiedAt) * 1000).toLocaleTimeString() :
                            new Date(record.created_at * 1000).toLocaleTimeString()
                          }
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {attendanceRecords?.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📱</div>
              <h3 className="text-lg font-semibold mb-2">No check-ins yet</h3>
              <p className="text-muted-foreground text-sm">
                Attendees will appear here when they scan the QR code
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}