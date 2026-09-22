// scripts/test-weighting.ts
import { PrismaClient } from '@prisma/client';

// We'll mock some data and test the logic indirectly by calling the service 
// but since it's hard to mock Prisma in a simple script without a full test runner,
// I'll extract the logic into a testable function or just manually verify with a few pros in the DB.

// For now, let's just log the scores of existing pros.

async function testWeighting() {
    const prisma = new PrismaClient();

    try {
        const pros = await prisma.professional.findMany({
            include: {
                appointments: { select: { status: true } },
                earnings: { select: { platformFeeAmount: true } },
                applications: {
                    select: {
                        alreadyExperienced: true,
                        isBadgePaid: true,
                        user: {
                            select: {
                                lastOnline: true,
                                biography: true,
                            }
                        }
                    }
                }
            }
        });

        console.log(`Found ${pros.length} professionals. Calculating scores...`);

        const scores = pros.map(p => {
            const rating = p.rating || 0;
            const reviews = p.reviewCount || 0;
            const internal = {
                alreadyExperienced: p.applications?.[0]?.alreadyExperienced ?? false,
                isBadgePaid: p.applications?.[0]?.isBadgePaid ?? false,
                hasValidPaymentMethod: p.hasValidPaymentMethod,
                platformRevenue: p.earnings.reduce((sum, e) => sum + (e.platformFeeAmount || 0), 0),
                totalSessions: p.appointments.length,
                completedSessions: p.appointments.filter(a => a.status === 'completed').length,
                biography: p.biography || p.applications?.[0]?.user?.biography || "",
            };

            // A. Trust & Quality (43%)
            const ratingScore = rating / 5;
            const weightedRating = ratingScore * 0.18;
            const reviewScore = Math.min(reviews, 100) / 100;
            const weightedReviews = reviewScore * 0.10;

            const requiredFields = [p.name, p.image, p.location, internal.biography, p.rate, p.venue];
            const completedFields = requiredFields.filter(f => !!f).length;
            const profileScore = completedFields / requiredFields.length;
            const weightedProfile = profileScore * 0.08;

            const earnedBadgesCount = [p.isVerified, internal.isBadgePaid, rating >= 4.8].filter(Boolean).length;
            const badgeScore = earnedBadgesCount / 3;
            const weightedBadges = badgeScore * 0.07;

            // B. Availability & Activity (25%)
            const availabilityScore = internal.hasValidPaymentMethod ? 1 : 0;
            const weightedAvailability = availabilityScore * 0.10;

            let activityScore = 0;
            const lastOnline = p.applications?.[0]?.user?.lastOnline;
            if (lastOnline) {
                const daysSinceLastLogin = (Date.now() - new Date(lastOnline).getTime()) / (1000 * 60 * 60 * 24);
                activityScore = 1 - Math.min(daysSinceLastLogin, 30) / 30;
            }
            const weightedActivity = activityScore * 0.15;

            // C. Experience & Reliability (15%)
            const monthsActive = (Date.now() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30.44);
            const seniorityScore = Math.min(monthsActive, 36) / 36;
            const weightedSeniority = seniorityScore * 0.08;

            const communityScore = internal.totalSessions > 0 ? internal.completedSessions / internal.totalSessions : 0;
            const weightedCommunity = communityScore * 0.07;

            // D. Platform Health (10%)
            const revenueScore = Math.min(internal.platformRevenue, 1000) / 1000;
            const weightedRevenue = revenueScore * 0.10;

            let baseScore = weightedRating + weightedReviews + weightedProfile + weightedBadges +
                weightedAvailability + weightedActivity + weightedSeniority +
                weightedCommunity + weightedRevenue;

            let finalScore = baseScore; // No location multiplier for global list

            if (monthsActive < 2) finalScore += 0.05;
            if (lastOnline) {
                const daysSinceLastLogin = (Date.now() - new Date(lastOnline).getTime()) / (1000 * 60 * 60 * 24);
                if (daysSinceLastLogin > 45) finalScore *= 0.7;
            }

            return {
                name: p.name,
                rating,
                reviews,
                baseScore,
                finalScore,
                details: {
                    weightedRating,
                    weightedReviews,
                    weightedProfile,
                    weightedBadges,
                    weightedAvailability,
                    weightedActivity,
                    weightedSeniority,
                    weightedCommunity,
                    weightedRevenue
                }
            };
        });

        scores.sort((a, b) => b.finalScore - a.finalScore);

        console.table(scores.map(s => ({
            Name: s.name,
            Score: s.finalScore.toFixed(4),
            Rating: s.rating,
            Reviews: s.reviews,
            Activity: s.details.weightedActivity.toFixed(4),
            Revenue: s.details.weightedRevenue.toFixed(4)
        })));

    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

testWeighting();
