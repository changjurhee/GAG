#include "BangGuChaGameModeBase.h"
#include "Kismet/GameplayStatics.h"

ABangGuChaGameModeBase::ABangGuChaGameModeBase() {
  Score = 0;
  CollectedFlags = 0;
  TotalFlags = 0; // Should be set by MapGenerator
}

void ABangGuChaGameModeBase::BeginPlay() {
  Super::BeginPlay();
  UE_LOG(LogTemp, Warning, TEXT("BangGuCha Game Started!"));
}

void ABangGuChaGameModeBase::AddScore(int32 Amount) { Score += Amount; }

void ABangGuChaGameModeBase::OnFlagCollected() {
  CollectedFlags++;
  AddScore(100);
  CheckWinCondition();
}

void ABangGuChaGameModeBase::CheckWinCondition() {
  if (TotalFlags > 0 && CollectedFlags >= TotalFlags) {
    Victory();
  }
}

void ABangGuChaGameModeBase::GameOver() {
  UE_LOG(LogTemp, Warning, TEXT("GAME OVER!"));
  // Implement UI logic or restart here
}

void ABangGuChaGameModeBase::Victory() {
  UE_LOG(LogTemp, Warning, TEXT("VICTORY!"));
  // Implement UI logic or restart here
}
