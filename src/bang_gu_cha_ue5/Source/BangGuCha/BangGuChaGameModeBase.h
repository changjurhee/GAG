#pragma once

#include "BangGuChaGameModeBase.generated.h"
#include "CoreMinimal.h"
#include "GameFramework/GameModeBase.h"

/**
 *
 */
UCLASS()
class BANGGUCHA_API ABangGuChaGameModeBase : public AGameModeBase {
  GENERATED_BODY()

public:
  ABangGuChaGameModeBase();

  virtual void BeginPlay() override;

  // Game State
  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Game State")
  int32 Score;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Game State")
  int32 TotalFlags;

  UPROPERTY(VisibleAnywhere, BlueprintReadOnly, Category = "Game State")
  int32 CollectedFlags;

  UFUNCTION(BlueprintCallable, Category = "Game Logic")
  void AddScore(int32 Amount);

  UFUNCTION(BlueprintCallable, Category = "Game Logic")
  void OnFlagCollected();

  UFUNCTION(BlueprintCallable, Category = "Game Logic")
  void GameOver();

  UFUNCTION(BlueprintCallable, Category = "Game Logic")
  void Victory();

protected:
  void CheckWinCondition();
};
