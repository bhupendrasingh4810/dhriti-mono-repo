"use client";

import React, { useState } from 'react';
import {
  Container,
  Box,
  Typography,
  Divider,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Grid,
  Link,
  Card,
  CardContent,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import SecurityIcon from '@mui/icons-material/Security';
import GavelIcon from '@mui/icons-material/Gavel';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import { MarketingSiteHeader } from '@/components/marketing/MarketingSiteHeader';

export default function TermsAndConditions() {
  const [expanded, setExpanded] = useState<string | false>('panel1');

  const handleAccordionChange = (panel: string) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpanded(isExpanded ? panel : false);
  };

  return (
    <>
      <MarketingSiteHeader
        navItems={["Product", "Solutions", "Resources", "Pricing", "Company"]}
        signInHref="/login"
        ctaHref="/get-started"
        ctaLabel="Get Started"
      />

      <Container maxWidth="md" sx={{ py: 6 }}>
        <Paper elevation={0} variant="outlined" sx={{ p: { xs: 3, md: 5 }, borderRadius: 3 }}>
          {/* Header Section */}
          <Box sx={{ mb: 4, textAlign: 'center' }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              Terms and Conditions
            </Typography>
            <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
              Last Updated: [DD Month YYYY]
            </Typography>
          </Box>

          <Divider sx={{ mb: 4 }} />

          {/* Intro Section */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="body1" component="div" sx={{ mb: 2, color: 'text.primary' }}>
              Welcome to <strong>Dhriti</strong>.
            </Typography>
            <Typography variant="body1" component="p" sx={{ mb: 2, color: 'text.secondary' }}>
              These Terms and Conditions (&quot;Terms&quot;, &quot;Agreement&quot;) govern your access to and use of the Dhriti platform, website, applications, APIs, services, and related products (collectively, the &quot;Services&quot;) provided by <strong>[LEGAL ENTITY NAME]</strong>, a company incorporated under the laws of India (&quot;Dhriti&quot;, &quot;Company&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;).
            </Typography>
            <Typography variant="body1" component="p" sx={{ mb: 2, color: 'text.secondary' }}>
              By accessing or using the Services, you agree to be bound by these Terms. If you are using the Services on behalf of an organization, company, institution, or other legal entity (&quot;Organization&quot;), you represent and warrant that you have authority to bind that Organization to these Terms.
            </Typography>
            <Typography variant="body1" component="p" sx={{ color: 'error.main', fontWeight: 500 }}>
              If you do not agree with these Terms, you must not access or use the Services.
            </Typography>
          </Box>

          {/* Sections Block */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Section 1 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                1. About Dhriti
              </Typography>
              <Typography variant="body1" component="p" sx={{ mb: 2, color: 'text.secondary' }}>
                Dhriti is an enterprise collaboration and work-management platform designed to help individuals and organizations connect, communicate, organize work, manage knowledge, coordinate activities, and make informed decisions.
              </Typography>
              <Typography variant="body1" component="p" sx={{ mb: 2, color: 'text.secondary' }}>
                Depending on the plan and permissions assigned to you, the Services may include applications and functionality such as:
              </Typography>
              <Grid container spacing={1} sx={{ pl: 1 }}>
                {[
                  'Home and personalized workspaces',
                  'Connect and team communication',
                  'Flow and project/work management',
                  'Atlas and knowledge/document management',
                  'Pulse and meetings/calendar functionality',
                  'Nexus and intelligence/insight features',
                  'Control and organization administration',
                  'Messaging and collaboration',
                  'Notifications',
                  'File and document storage',
                  'Search',
                  'Integrations and APIs',
                  'Automation and workflow functionality',
                  'Analytics and reporting',
                  'Artificial intelligence or machine-learning assisted functionality',
                  'Other functionality introduced by Dhriti from time to time'
                ].map((item, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Section 2 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                2. Eligibility
              </Typography>
              <Typography variant="body1" component="p" sx={{ mb: 2, color: 'text.secondary' }}>
                You must be legally capable of entering into a binding agreement to use the Services.
              </Typography>
              <Typography variant="body1" component="p" sx={{ mb: 1, color: 'text.secondary' }}>
                If you use Dhriti on behalf of an Organization:
              </Typography>
              <List dense>
                {[
                  'You confirm that you are authorized to act on behalf of that Organization.',
                  'The Organization is responsible for the use of the Services by its authorized users.',
                  'The Organization is responsible for maintaining appropriate user permissions and access controls.',
                  'The Organization agrees to these Terms.'
                ].map((text, index) => (
                  <ListItem key={index}>
                    <ListItemIcon sx={{ minWidth: 28 }}>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>{index + 1}.</Typography>
                    </ListItemIcon>
                    <ListItemText primary={text} slotProps={{ primary: { variant: 'body2', sx: { color: 'text.secondary' } } }} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider />

            {/* Section 3 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                3. Accounts
              </Typography>
              <Typography variant="body1" component="p" sx={{ mb: 1, color: 'text.secondary' }}>
                Certain Services require you to create or be invited to a user account. You agree to:
              </Typography>
              <List dense disablePadding sx={{ pl: 2 }}>
                {[
                  'Provide accurate and current information',
                  'Maintain the confidentiality of your authentication credentials',
                  'Use appropriate security practices',
                  'Promptly notify us of unauthorized access',
                  'Not share authentication credentials with unauthorized persons',
                  'Not create an account for another person without authorization'
                ].map((item, index) => (
                  <ListItem key={index} disableGutters sx={{ py: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 24 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8 }} />
                    </ListItemIcon>
                    <ListItemText primary={item} slotProps={{ primary: { variant: 'body2', sx: { color: 'text.secondary' } } }} />
                  </ListItem>
                ))}
              </List>
            </Box>

            <Divider />

            {/* Section 4 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                4. Organization Accounts and Administrators
              </Typography>
              <Typography variant="body1" component="p" sx={{ mb: 2, color: 'text.secondary' }}>
                Dhriti supports multi-user and multi-tenant Organization environments. An Organization administrator may have the ability to:
              </Typography>
              <Grid container spacing={1} sx={{ pl: 1 }}>
                {[
                  'Invite and remove users',
                  'Assign roles and permissions',
                  'Manage teams and groups',
                  'Configure applications',
                  'Manage Organization settings',
                  'Access Organization data where permitted by the Services',
                  'Manage integrations',
                  'Configure retention or access policies where available',
                  'Suspend or deactivate user access'
                ].map((item, index) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={index}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FiberManualRecordIcon sx={{ fontSize: 8, color: 'text.secondary' }} />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>{item}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <Divider />

            {/* Section 5, 6, 7 & 8 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                Subscriptions, Billing & Cancellation
              </Typography>

              <Box sx={{ mt: 2 }}>
                <Accordion expanded={expanded === 'panel1'} onChange={handleAccordionChange('panel1')}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 500 }}>5. Subscriptions and Plans</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                      Certain Services may require a paid subscription. Subscription plans, pricing, usage limits, features, billing periods, and applicable taxes will be presented during the applicable purchasing or subscription process.
                    </Typography>
                    <List dense disablePadding>
                      <ListItem><ListItemText primary="• Subscriptions renew according to the selected billing period." /></ListItem>
                      <ListItem><ListItemText primary="• Applicable taxes may be charged in addition to displayed prices." /></ListItem>
                      <ListItem><ListItemText primary="• Usage may be subject to plan-specific limits." /></ListItem>
                    </List>
                  </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel2'} onChange={handleAccordionChange('panel2')}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 500 }}>6. Free Trials and Promotional Access</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      We may offer free trials, promotional subscriptions, credits, or limited-access versions of the Services. Trial access is provided for evaluation purposes and functionality may be limited.
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel3'} onChange={handleAccordionChange('panel3')}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 500 }}>7. Payment and Taxes</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      You agree to pay all applicable fees associated with your selected subscription. You are responsible for applicable taxes, duties, levies, or similar governmental charges, except taxes imposed on Dhriti's income.
                    </Typography>
                  </AccordionDetails>
                </Accordion>

                <Accordion expanded={expanded === 'panel4'} onChange={handleAccordionChange('panel4')}>
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Typography sx={{ fontWeight: 500 }}>8. Cancellation and Refunds</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Cancellation will take effect at the end of the current billing period. Previously paid subscription fees are generally non-refundable unless required by applicable law or expressly stated in a separate agreement.
                    </Typography>
                  </AccordionDetails>
                </Accordion>
              </Box>
            </Box>

            <Divider />

            {/* Section 9 & 10 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                9. Your Content & Responsibilities
              </Typography>
              <Typography variant="body1" component="p" sx={{ color: 'text.secondary' }}>
                You retain ownership of your Customer Content. You grant Dhriti a limited, worldwide, non-exclusive right to host, store, reproduce, process, and transmit Customer Content solely as reasonably necessary to operate and maintain the Services.
              </Typography>
            </Box>

            <Divider />

            {/* Section 11 */}
            <Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                11. Acceptable Use
              </Typography>
              <Typography variant="body1" component="p" sx={{ color: 'text.secondary' }}>
                You must not use the Services to violate laws, impersonate others, breach security, distribute malware, or reverse engineer the platform.
              </Typography>
            </Box>

            <Divider />

            {/* Section 15: AI */}
            <Card variant="outlined" sx={{ backgroundColor: 'action.hover', borderStyle: 'dashed' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <SmartToyIcon color="primary" />
                  <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>
                    15. Artificial Intelligence Features
                  </Typography>
                </Box>
                <Typography variant="body2" sx={{ mb: 1, color: 'text.secondary' }}>
                  Certain Dhriti features may use artificial intelligence or automated processing. AI-generated results may be incomplete, inaccurate, or outdated.
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontWeight: 500 }}>
                  AI output should not be treated as professional legal, medical, financial, or employment advice.
                </Typography>
              </CardContent>
            </Card>

            <Divider />

            {/* Legal Limitations */}
            <Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <GavelIcon color="action" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Governing Law</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        These Terms are governed by the laws of India. Courts located in <strong>[CITY, STATE, INDIA]</strong> hold jurisdiction.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Card variant="outlined">
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <SecurityIcon color="action" />
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>Limitation of Liability</Typography>
                      </Box>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        Dhriti's aggregate liability will not exceed the total fees paid by you in the 12 months preceding the event.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>

            <Divider />

            {/* Section 29: Contact Section */}
            <Box sx={{ mt: 2 }}>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 600, color: 'text.primary' }}>
                29. Contact Us
              </Typography>
              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                If you have questions regarding these Terms, contact us at:
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      General Legal Inquiries
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>[LEGAL ENTITY NAME]</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>[REGISTERED OFFICE ADDRESS]</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Link href="mailto:[LEGAL/CONTACT EMAIL]" variant="body2">[LEGAL/CONTACT EMAIL]</Link>
                    </Box>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <Typography variant="subtitle2" color="primary" gutterBottom>
                      Grievance Officer
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>[NAME / DESIGNATION]</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <EmailIcon fontSize="small" color="action" />
                      <Link href="mailto:[GRIEVANCE EMAIL]" variant="body2">[GRIEVANCE EMAIL]</Link>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <LocationOnIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>[ADDRESS]</Typography>
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Box>
        </Paper>
      </Container>
    </>
  );
}